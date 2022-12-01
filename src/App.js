import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import worker_script from "./worker.js";
import "./styles.css";

const DURATION = 5000; // ms
const INTERVAL = 100; // ms
const OFFSET = 0; // perc
const CALCULATE_MAX_TIMEOUT = 1000; // ms
const INTERVAL_MAX_UPDATE = 500; // ms
const TRANSITIONS_DURATION = 1; // s

const worker1 = new Worker(worker_script);
const worker2 = new Worker(worker_script);

let intervalId = null;
let intervalCount = 0;

worker1.postMessage({
  config: {
    duration: DURATION,
    interval: INTERVAL
  }
});

worker2.postMessage({
  config: {
    duration: DURATION,
    interval: INTERVAL
  }
});

worker1.addEventListener("error", function (event) {
  // console.error("error received from worker => ", event);
});

worker2.addEventListener("error", function (event) {
  // console.error("error received from worker => ", event);
});

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function relDiff(a, b) {
  return 100 * Math.abs((a - b) / ((a + b) / 2));
}

function arrAvg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [dirty, setDirty] = useState(false);
  const [isReady, setIsReady] = useState(true);
  const [result1, setResult1] = useState(0);
  const [result2, setResult2] = useState(0);
  const [maxCount, setMaxCount] = useState(0);
  const result1Ref = useRef(null);
  const result2Ref = useRef(null);
  const countRef = useRef(null);
  const inputRef = useRef(null);
  const count1Ref = useRef(0);
  const count2Ref = useRef(0);
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [isBarAnimated, setIsBarAnimated] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const intervalFunc = () => {
    intervalCount++;
    const currentMax = Math.max(count1Ref.current, count2Ref.current);
    const estimatedMax =
      currentMax *
      (DURATION / (intervalCount * INTERVAL_MAX_UPDATE)) *
      (OFFSET / 100 + 1);
    setMaxCount(estimatedMax);
    // console.log(">>currentMax", currentMax);
    // console.log(">>estimatedMax", estimatedMax);
  };

  useEffect(() => {
    worker1.addEventListener("message", function (event) {
      if (event.data === "start") {
        // console.log(">>started");
        setIsBenchmarking(true);
        setIsBarAnimated(true);
        // setTimeout(() => {
        //   const currentMax = Math.max(count1Ref.current, count2Ref.current);
        //   const estimatedMax = currentMax * (DURATION / CALCULATE_MAX_TIMEOUT) * (OFFSET / 100 + 1)
        //   setMaxCount(estimatedMax);
        //   console.log(">>currentMax", currentMax);
        //   console.log(">>estimatedMax", estimatedMax);
        // }, CALCULATE_MAX_TIMEOUT);
        intervalId = setInterval(intervalFunc, INTERVAL_MAX_UPDATE);
      } else if (event.data === "end") {
        // console.log(">>end");
        intervalFunc();
        setIsBenchmarking(false);
        setTimeout(() => {
          setIsBarAnimated(false);
          setIsReady(true);
        }, TRANSITIONS_DURATION * 1000);
        // console.log(">>clearInterval", intervalId);
        clearInterval(intervalId);
        intervalCount = 0;
      } else {
        setCount1(event.data);
        count1Ref.current = event.data;
      }
    });
    worker2.addEventListener("message", function (event) {
      if (event.data === "start") {
      } else if (event.data === "end") {
        // code
      } else {
        setCount2(event.data);
        count2Ref.current = event.data;
      }
    });
  }, []);

  const handleOnClickWorker = async () => {
    if (isBenchmarking) return;
    try {
      const script1 = result1Ref.current.value;
      const script2 = result2Ref.current.value;
      if (!Boolean(script1.trim()) || !Boolean(script2.trim())) {
        throw new Error("Empty");
      }
      eval(script1);
      eval(script2);
      setIsReady(false);
      setMaxCount(0);
      setCount1(0);
      setCount2(0);
      worker1.postMessage({ script: script1 });
      worker2.postMessage({ script: script2 });
      setDirty(true);
    } catch (e) {
      // console.log(e);
    }
  };

  return (
    <div className="container">
      <img src="js.svg" className="js" />
      <p className="footer">
        <a href="https://www.linkedin.com/in/sanjinceleski/" target="_blank">
          Developed with passion 🇦🇪
        </a>
      </p>
      <div className="wrapper">
        <div className="content">
          <h1>
            Benchmark <span className="rocket">🚀</span>
          </h1>
          <h2>Compare JavaScript Performance</h2>
          <div className="benchmarks">
            <div>
              {/* <h3>
                {isBenchmarking
                  ? `${count1.toLocaleString("en-US")} ops`
                  : `${parseInt(count1 / (DURATION / 1000)).toLocaleString(
                      "en-US"
                    )} op/s`}
              </h3> */}
              <textarea
                ref={result1Ref}
                defaultValue="// is this faster?&#13;&#10;var answer = 42;"
              ></textarea>
            </div>
            <div className="run-container">
              <div className="run" onClick={handleOnClickWorker}>
                <div className={`gear-icon ${isReady ? "" : "rotate"}`}>
                  <img src="gear.svg" />
                </div>
                <div className="play-icon-container">
                  {isReady && <div className="play-icon"></div>}
                </div>
              </div>
            </div>
            <div>
              {/* <h3>
                {isBenchmarking
                  ? `${count2.toLocaleString("en-US")} ops`
                  : `${parseInt(count2 / (DURATION / 1000)).toLocaleString(
                      "en-US"
                    )} op/s`}
              </h3> */}
              <textarea
                ref={result2Ref}
                defaultValue="// or is this faster?&#13;&#10;const answer = 42;"
              ></textarea>
            </div>
          </div>
          {/* <button onClick={handleOnClickWorker} disabled={!isReady}>
            {isReady ? "WORK" : "WORKING"}
          </button> */}
          <div className={`rails ${dirty ? "" : "rails--hidden"}`}>
            <div className="rail">
              <div
                className={`bar ${isBarAnimated ? "bar--animated" : ""}`}
                style={{
                  width: `${
                    count1 && maxCount ? (count1 / maxCount) * 100 : 0
                  }%`,
                  transitionDuration: isBarAnimated
                    ? `${TRANSITIONS_DURATION}s`
                    : "unset"
                }}
              ></div>
            </div>
            <div className="rail">
              <div
                className={`bar ${isBarAnimated ? "bar--animated" : ""}`}
                style={{
                  width: `${
                    count2 && maxCount ? (count2 / maxCount) * 100 : 0
                  }%`,
                  transitionDuration: isBarAnimated
                    ? `${TRANSITIONS_DURATION}s`
                    : "unset"
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
