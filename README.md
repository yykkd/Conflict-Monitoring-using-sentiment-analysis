# LEVERAGING SENTIMENT ANALYSIS FOR CONFLICT MONITORING IN SUB- SAHARAN AFRICA

Conflict monitoring systems provide a means to collect data and analyze conflict. With 570 million internet users in the sub-Saharan Africa region as of 2022, 
there is an opportunity to utilize social media data for conflict monitoring in the area. Recognizing the need for a conflict monitoring system that enables the monitoring of conflict to support quick response and action, the project's objective is to build a system that uses sentiment analysis as a feature to analyze the occurrence of disorders and events given a geographical area. 

The proposed system uses machine learning based approaches to extract sentiment and determine the occurrence of disorders and event types. The project uses the pysentimiento library based on BERT transformer models for sentiment analysis. The prediction model uses BERT embedding of the social media data and neural network embedding of the sentiment scores for the embedding layer of the model. 

Disorder type model has the metrics:
![image](https://github.com/user-attachments/assets/4fc8b84b-c66e-4c47-a58c-dae59026a893)

Event type model has the metrics:
![image](https://github.com/user-attachments/assets/540ced82-5c2e-42f9-b715-68523de0c204)

The individual models can be found in the backend folder

## How to use project
1. Enter the backend folder and run the app.py server
2. Enter the frontend folder, go to the firebase-app, and run the authentication firebase api. A key.json file is required
3. In the frontend conflict-monitoring folder npm start the frontend application

Note that the data is not included in the github repository due to rules surrounding using data from X (formerly Twitter)

To request the data, reach out to the author on email angaawaa14@gmail.com
