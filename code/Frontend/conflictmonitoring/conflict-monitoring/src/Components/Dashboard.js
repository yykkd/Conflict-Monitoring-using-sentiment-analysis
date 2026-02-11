import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import ArcTween from "./ArcTween.js";
import WordCloud from './WordCloud';
import { useNavigate } from "react-router-dom";
import Papa from 'papaparse';
import { useAuth } from './Authentication';

function Dashboard() {

  const { logout } = useAuth();
  const navigate = useNavigate();
  const [socketInstance, setSocketInstance] = useState("");
  const [buttonStatus, setButtonStatus] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [history, setHistory] = useState([]);


  const latestPrediction = predictions[predictions.length - 1];

  const handleLogOut = () =>{
    logout();
    navigate('/Login');
  };

  const handleChangeCountry = () =>{
    navigate('/CountrySelect');
  };

  const handleDownloadReport = () => {
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'predictions_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const formattedData = history.map(pred => ({
      Disorder_Type: pred.final_prediction_disorder,
      Disorder_Confidence: pred.confidence_disorder,
      Event_Type: pred.final_prediction_event,
      Event_Confidence: pred.confidence_event
    }));
    setCsvData(formattedData);
  }, [history]);

  useEffect(() => {
    const newKeywords = predictions.reduce((acc, pred) => [...acc, ...pred.top_keywords], []);
    setKeywords(newKeywords);
  }, [predictions]);


  useEffect(() => {
    const socket  = io("http://localhost:5001");

    setSocketInstance(socket);

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("predict", (data) => {
      data = data.data;
      if (!isNaN(data.confidence_disorder) && data.final_prediction_disorder !== undefined ||
          !isNaN(data.confidence_event) && data.final_prediction_event !== undefined) {
        setPredictions([data]);
        setHistory(prevHistory => [...prevHistory, data]);
      }
    });

    return () => {
      fetch("http://localhost:5000/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));

      if (socket) {
        socket.disconnect();
      }
      // console.log("Disconnected from server");
    };

    // if (buttonStatus === true) {

    // }

    //   else{
    //     if (socketInstance) {
    //     socketInstance.disconnect();
    //     setSocketInstance(null);
    //   } 
    // }
    
  }, []);

  // buttonStatus]



  return (
    <div className="font-serif">
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl font-bold">Conflict Monitoring System Dashboard</a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            {/* <button className="btn btn-outline btn-accent mx-2" onClick={handleClick}>{buttonStatus ? "Stop Predicting" : "Start Predicting"}</button> */}
            <button className="btn btn-outline btn-accent mx-2" onClick={handleChangeCountry}>Change Country</button>
            <button className="btn btn-outline btn-accent mx-2" onClick={handleDownloadReport}>Download Report</button>
            <button className="btn btn-outline btn-accent mx-2" onClick={handleLogOut}>Logout</button>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="w-2/4 flex flex-col items-center justify-center  p-8 ">
          <div className="text-2xl">
            <p >Keywords From Occurrence</p>
          </div>
          <div>
            <WordCloud keywords={keywords} />
          </div>
        </div>
            
        <div className="w-2/4" style={{ flex: 1, minHeight: '400px' }}>
          {latestPrediction && (
              <>
              <div className="flex flex-col">~
                <div className="flex flex-row items-center">
                  <ArcTween
                    confidence={latestPrediction.confidence_disorder}
                  />
                  <div className="flex flex-col">
                    <p>Disorder Type:</p>
                    <p className="text-2xl">{latestPrediction.final_prediction_disorder}</p>
                  </div>
                </div>
                <div className="flex flex-row items-center">
                  <ArcTween
                      confidence={latestPrediction.confidence_event}
                  />
                  <div className="flex flex-col">
                    <p>Event Type:</p>
                    <p className="text-2xl">{latestPrediction.final_prediction_event}</p>
                  </div>
                </div>   
              </div>
              </>
            )}
          </div>
      </div>
    </div>

  );
}

export default Dashboard;

