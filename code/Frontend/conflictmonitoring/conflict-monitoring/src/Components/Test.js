import { useEffect, useState } from "react";

export default function Test() {
  const [data, setData] = useState("");

  useEffect(() => {
    fetch("http://localhost:5001/test", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseData) => {
        console.log(responseData.data);
        setData(responseData.data);
      });
  });
  return (
    <>
      <h2>HTTP Communication</h2>
      <h3 className="">{data}</h3>
    </>
  );
}