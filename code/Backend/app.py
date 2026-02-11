from flask import Flask, request, jsonify, make_response
import pandas as pd
import time
import requests
import os
import logging
from flask_cors import CORS
import numpy as np
import threading
import torch
import torch.nn as nn
import pickle
from transformers import AutoTokenizer, AutoModel
from keybert import KeyBERT
from pysentimiento import create_analyzer
from TweetNormalizer import normalizeTweet
from sklearn.base import BaseEstimator, TransformerMixin
from torch.utils.data import TensorDataset
from torch.utils.data import DataLoader
import torch.nn.functional as F
from collections import Counter
from flask_socketio import SocketIO, emit
import re
import threading


app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*") 
terminate_flag = False

@app.route("/start", methods=["POST"])
def start():
    global terminate_flag
    terminate_flag = False
    data = request.json
    country = data["country"]
    local_csv_file = f'{country}_test_tweets.csv'
    threading.Thread(target=start_processing, args=(local_csv_file,)).start()
    
    print("Data monitoring started")
    return jsonify({"message": "Data monitoring started"}), 200

@app.route("/stop", methods=["POST"])
def stop():
    global terminate_flag
    terminate_flag = True
    
    print("Data monitoring stopped")
    return jsonify({"message": "Data monitoring stopped"}), 200

@app.route("/test")
def test():
    data = {"data":"This text was fetched using an HTTP call to server on render"}
    return jsonify(data)

@socketio.on("connect")
def connected():
    """event listener when client connects to the server"""
    print(request.sid)
    print("connected")
    emit("connect",{"data":f"id: {request.sid} is connected"})

@socketio.on("disconnect")
def disconnected():
    """event listener when client disconnects to the server"""
    print("user disconnected")
    emit("disconnect",f"user {request.sid} disconnected")



tokenizer = AutoTokenizer.from_pretrained("distilbert/distilbert-base-uncased")
bertweet = AutoModel.from_pretrained("distilbert/distilbert-base-uncased")
kw_model = KeyBERT()

# Initialize the analyzers
sentiment_analyzer = create_analyzer(task="sentiment", lang="en")
emotion_analyzer = create_analyzer(task="emotion", lang="en")
hate_speech_analyzer = create_analyzer(task="hate_speech", lang="en")
keywords_dict = {}


# Define the logistic regression model class
class LogisticRegression(torch.nn.Module):
    def __init__(self):
        super(LogisticRegression, self).__init__()
        self.linear = torch.nn.Linear(768, 1)

    def forward(self, x):
        y_pred = torch.sigmoid(self.linear(x))
        return y_pred

    def predict(self, x):
        model_out = self.forward(x)
        return (model_out > 0.5).int()

    def predict_proba(self, x):
        model_out = self.forward(x)
        return model_out

with open("./bertweet_model.pkl", 'rb') as f:
    civil_unrest_model = pickle.load(f)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
civil_unrest_model.to(device)
civil_unrest_model.eval()

class CombinedModel(nn.Module):
    def __init__(self, hidden_dim, output_dim, input_dim, num_hidden_layers):
        '''
        A simple model that combines text embeddings from BERTweet with numerical features to predict the disorder type.

        Args:
            # text_embedding_dim (int): Dimension of the text embeddings from BERTweet. remove
            numerical_feature_dim (int): Dimension of the numerical features. remove
            hidden_dim (int): Dimension of the hidden layers.
            output_dim (int): Dimension of the output layer.
        '''
        super(CombinedModel, self).__init__()

        # Fully connected layers for combined features
        self.fc_combined = nn.Sequential()
        self.fc_combined.append(nn.Linear(input_dim, hidden_dim))
        self.fc_combined.append(nn.ReLU())
        self.fc_combined.append(nn.Dropout(0.3))
        for _ in range(num_hidden_layers - 1):  # Subtract 1 to account for the first layer
            self.fc_combined.append(nn.Linear(hidden_dim, hidden_dim))
            self.fc_combined.append(nn.ReLU())
            self.fc_combined.append(nn.Dropout(0.3))
        self.fc_combined.append(nn.Linear(hidden_dim, output_dim))  # Output layer

    def forward(self, combined_embeddings):
        '''
        Forward pass of the model.
        '''
        # Process combined embeddings
        output = self.fc_combined(combined_embeddings)

        return output


class Estimator(BaseEstimator, TransformerMixin):
    def __init__(self, input_dim=896,
                 hidden_dim=128, output_dim=4, num_epochs=10, lr=0.001, batch_size=32, num_hidden_layers=2):
      # consider adding number of hidden layers
      self.input_dim = input_dim
      self.hidden_dim = hidden_dim
      self.output_dim = output_dim
      self.num_epochs = num_epochs
      self.lr = lr
      self.batch_size = batch_size
      self.num_hidden_layers = num_hidden_layers
      self.model = CombinedModel(self.hidden_dim, self.output_dim, self.input_dim, self.num_hidden_layers)
      self.criterion = nn.CrossEntropyLoss()
      self.optimizer = torch.optim.Adam(self.model.parameters(), lr=self.lr)

    def fit(self, X, y):
      X = X.clone().detach()
      y = torch.tensor(y)
      dataset = TensorDataset(X, y)
      dataloader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

      for epoch in range(self.num_epochs):
        self.model.train()
        running_loss = 0.0

        for i, (inputs, labels) in enumerate(dataloader):
            self.optimizer.zero_grad()
            outputs = self.model(inputs)
            loss =self.criterion(outputs, labels)
            loss.backward()
            self.optimizer.step()

            running_loss += loss.item()

        epoch_loss = running_loss / len(dataloader)
        print(f'Epoch [{epoch+1}/{self.num_epochs}], Loss: {epoch_loss:.4f}')

      return self

    def predict(self, X):
      X = X.clone().detach()
      self.model.eval()
      with torch.no_grad():
        outputs = self.model(X)
        probabilities = F.softmax(outputs, dim=1)  # Get probabilities
        _, predicted = torch.max(outputs.data, 1)
        return predicted.cpu().numpy()

    def predict_proba(self, X):
      X = X.clone().detach()
      self.model.eval()
      with torch.no_grad():
          # text_input_ids, numerical_features = torch.tensor(X[0]).to(self.device), torch.tensor(X[1]).to(self.device)
          outputs = self.model(X)  # Assuming attention_mask is None
          probabilities = F.softmax(outputs, dim=1)
      return probabilities.numpy()

with open('best_disorer_type_model.pkl', 'rb') as f:
    disorder_model = pickle.load(f)

with open('best_event_type_model.pkl', 'rb') as e:
    event_model = pickle.load(e)

    
events = {
    0: "Protests",
    1: "Violence against civilians",
    2: "No relevant event",
    3: "Explosions/Remote violence",
    4: "Battles",
    5: "Strategic developments",
    6: "Riots"
}

disorders = {
    0: "Demonstrations",
    1: "Political violence",
    2: "No relevant event",
    3: "Strategic developments"
}


def start_processing(local_csv_file):
    if os.path.exists("data/predictions.csv"):
        os.remove("data/predictions.csv")
    if os.path.exists("data/final_predictions.csv"):
        os.remove("data/final_predictions.csv")

    df = pd.read_csv(local_csv_file, parse_dates=['created_at'])
    keyword_text = ""

    for i, row in df.iterrows():
        if terminate_flag:
            print("Process terminated")
            break

        text = row['text']
        
        unrest_tweets = filter_by_unrest_score(text)
        if unrest_tweets:
            keyword_text += text + " "
            if i % 10 == 0:
                save_keywords(keyword_text)
                keyword_text = ""
            tweet_features = get_features(text)
            tweet_features["text"] = text
            feature_df = pd.DataFrame(tweet_features, index=[0])
            embeddings = create_combined_embeddings(feature_df)
            predictions = predict_scores(embeddings)

            disorder = predictions["disorder"][0]
            event = predictions["event"][0]
            confidence_disorder = predictions["disorder"][1]
            confidence_event = predictions["event"][1]
            
            file_name = f"data/predictions.csv"

            df_predictions = pd.DataFrame({
                "predictions_disorder": [disorder],
                "predictions_event": [event],
                "confidence_disorder": [confidence_disorder],
                "confidence_event": [confidence_event]
            })

            if os.path.exists(file_name):
                df_existing = pd.read_csv(file_name)
                df_combined = pd.concat([df_existing, df_predictions])
            else:
                df_combined = df_predictions
                
            df_combined.to_csv(file_name, index=True)

            results = majority_voting_multiclass(df_combined)

    return jsonify({"message": "Data monitored successfully"}), 200


def majority_voting_multiclass(df_combined):
    disorder_confidence = df_combined["confidence_disorder"]
    event_confidence = df_combined["confidence_event"]
    disorder = df_combined["predictions_disorder"]
    event = df_combined["predictions_event"]

    # Perform majority voting for disorder predictions
    disorder_counter = Counter(disorder)
    final_prediction_disorder = disorder_counter.most_common(1)[0][0]

    # Perform majority voting for event predictions
    event_counter = Counter(event)
    final_prediction_event = event_counter.most_common(1)[0][0]

    # Determine unique classes
    disorder_classes = np.unique(disorder)
    event_classes = np.unique(event)

    # Initialize dictionaries to store weighted sums and counts
    weighted_sums_disorder = {clas: 0 for clas in disorder_classes}
    weighted_counts_disorder = {clas: 0 for clas in disorder_classes}

    weighted_sums_event = {cls: 0 for cls in event_classes}
    weighted_counts_event = {cls: 0 for cls in event_classes}

    # Accumulate weighted sums and counts for disorder
    for confidence, prediction in zip(disorder_confidence, disorder):
        weighted_sums_disorder[prediction] += confidence
        weighted_counts_disorder[prediction] += 1

    # Accumulate weighted sums and counts for event
    for confidence, prediction in zip(event_confidence, event):
        weighted_sums_event[prediction] += confidence
        weighted_counts_event[prediction] += 1

    overall_confidence_disorder = weighted_sums_disorder[final_prediction_disorder] / weighted_counts_disorder[final_prediction_disorder]
    overall_confidence_event = weighted_sums_event[final_prediction_event] / weighted_counts_event[final_prediction_event]

    keywords = sorted(keywords_dict.items(), key=lambda x: x[1], reverse=True)
    
    # create list of dictionaries with the to 20 keywords as 'text' and their frequencyx10 as 'value'
    top_keywords = [{"text": keyword[0], "value": keyword[1]} for keyword in keywords[:20]]

    data_send = {
        "final_prediction_disorder": disorders[final_prediction_disorder],
        "final_prediction_event": events[final_prediction_event],
        "confidence_disorder": overall_confidence_disorder,
        "confidence_event": overall_confidence_event,
        "top_keywords": top_keywords
    }

    # send the final predictions to the front end
    with app.app_context():  
        socketio.emit("predict",{'data':data_send})

    # write the final predictions to the csv file
    prediction_file = f"data/final_predictions.csv"
    final_predictions = pd.DataFrame({
        "final_prediction_disorder": disorders[final_prediction_disorder],
        "final_prediction_event": events[final_prediction_event],
        "confidence_disorder": overall_confidence_disorder,
        "confidence_event": overall_confidence_event
    }, index=[0])

    if os.path.exists(prediction_file):
        df_existing = pd.read_csv(prediction_file)
        df_combined = pd.concat([df_existing, final_predictions])
    else:
        df_combined = final_predictions
        
    df_combined.to_csv(prediction_file, index=False)

    # Return the results
    return data_send


def filter_by_unrest_score(text):  
    tokens = normalizeTweet(text)
    tokens = tokenizer(tokens, padding=True, truncation=True, return_tensors="pt")
    input_ids, attention_mask = tokens["input_ids"].clone().detach(), tokens["attention_mask"]

    # Get text embeddings from BERTweet
    text_embeddings = bertweet(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state

    # Pool the embeddings (use the [CLS] token representation or mean pooling)
    text_embeddings = text_embeddings.mean(dim=1)

    # Make predictions
    text_embeddings = text_embeddings.to(device)

    with torch.no_grad():
        predictions_proba = civil_unrest_model.predict_proba(text_embeddings)

    discuss_unrest = predictions_proba > 0.5

    unrest_tweets = [text for i in range(len(discuss_unrest)) if discuss_unrest[i]]

    return unrest_tweets

def save_keywords(tweets):
    if tweets:
        keywords = kw_model.extract_keywords(tweets)
        for keyword in keywords:
            if keyword[0] in keywords_dict:
                keywords_dict[keyword[0]] += 1
            else:
                keywords_dict[keyword[0]] = 1

        pattern = re.compile(r"^#(\w*[a-zA-Z0-9])+$")

        hashtags = [word for word in tweets.split() if pattern.match(word)]
        for hashtag in hashtags:
            if hashtag in keywords_dict:
                keywords_dict[hashtag] += 1
            else:
                keywords_dict[hashtag] = 1

def get_features(text):
    tweet_features = {}
       
    # get the sentiment, emotion, and hate speech scores
    sentiment = sentiment_analyzer.predict(text).probas
    emotion = emotion_analyzer.predict(text).probas
    hate_speech = hate_speech_analyzer.predict(text).probas

    tweet_features['sentiment_neu'] = sentiment['NEU']
    tweet_features['sentiment_pos'] = sentiment['POS']
    tweet_features['sentiment_neg'] = sentiment['NEG']
    tweet_features['hs_hateful'] = hate_speech['hateful']
    tweet_features['hs_targeted'] = hate_speech['targeted']
    tweet_features['hs_aggressive'] = hate_speech['aggressive']
    tweet_features['emo_anger'] = emotion['anger'] if 'anger' in emotion else 0
    tweet_features['emo_fear'] = emotion['fear'] if 'fear' in emotion else 0
    tweet_features['emo_disgust'] = emotion['disgust'] if 'disgust' in emotion else 0
    tweet_features['emo_sadness'] = emotion['sadness'] if 'sadness' in emotion else 0
    tweet_features['emo_surprise'] = emotion['surprise'] if 'surprise' in emotion else 0

    return tweet_features


def create_tweets_embeddings(tweets):
    tweets = [normalizeTweet(tweet) for tweet in tweets]
    tweets = tokenizer(tweets, padding=True, truncation=True, return_tensors="pt")
    return tweets["input_ids"].clone().detach(), tweets["attention_mask"]


def features_to_tensor(features):
    return torch.tensor(features, dtype=torch.float32)


def data_to_embeddings(data): 
    df = pd.DataFrame(data, columns=['sentiment_neu', 'sentiment_pos', 'sentiment_neg', 'hs_hateful', 'hs_targeted', 'hs_aggressive', 'emo_anger',  'emo_fear', 'emo_disgust',  'emo_sadness', 'emo_surprise', 'text'])
    tweets = df['text'].tolist()
    features = df[["sentiment_pos","sentiment_neg","hs_hateful","hs_targeted","hs_aggressive","emo_anger",
                   "emo_fear","emo_disgust","emo_sadness","emo_surprise","sentiment_neu"]].values.tolist()

    tweets_embeddings, attention_mask = create_tweets_embeddings(tweets)
    features = features_to_tensor(features).float()

    return (tweets_embeddings, features, attention_mask)


def create_numerical_embeddings(numerical_feature_dim, hidden_dim, numerical_features):
    fc_numerical = nn.Sequential(
      nn.Linear(numerical_feature_dim, hidden_dim),
      nn.ReLU(),
      nn.Dropout(0.3)
    )

    embeddings = fc_numerical(numerical_features)

    return embeddings


def create_combined_embeddings(data):
    inputs = data_to_embeddings(data)
    text_input_ids = inputs[0]
    numerical_features = inputs[1]
    attention_masks = inputs[2]

    # Get text embeddings from BERTweet
    text_embeddings = bertweet(input_ids=text_input_ids, attention_mask=attention_masks).last_hidden_state

    # Pool the embeddings (use the [CLS] token representation or mean pooling)
    text_embeddings = text_embeddings.mean(dim=1)

    hidden_dim = 128
    numerical_feature_dim = 11

    # Process numerical features
    numerical_embeddings = create_numerical_embeddings(numerical_feature_dim, hidden_dim, numerical_features)

    combined_embeddings = torch.cat((text_embeddings, numerical_embeddings), dim=1)

    return combined_embeddings

def predict_scores(embeddings):
    predictions_disorder = disorder_model.predict(embeddings)
    confidence_disorder = disorder_model.predict_proba(embeddings).max(axis=1)
    predictions_event = event_model.predict(embeddings)
    confidence_event = event_model.predict_proba(embeddings).max(axis=1)

    predictions = {
        "disorder": [predictions_disorder.item(), confidence_disorder.item()],
        "event": [predictions_event.item(), confidence_event.item()]
    }

    return predictions


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
    