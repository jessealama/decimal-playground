import React, { useEffect, useState, useRef, useReducer } from "react";
import MonacoEditor from "react-monaco-editor";
import { ObjectInspector } from "react-inspector";
import { EDITOR_OPTIONS } from "./constants.js";

const editorOptions = {
  ...EDITOR_OPTIONS,
  readOnly: true,
};

const CLEAR = "clear";
const ADD = "add";

const methods = ["log", "warn", "error", "info", "debug", "command", "result"];
const emptyLogsList = [];
const logsReducer = (state, action) => {
  switch (action.type) {
    case CLEAR:
      return [];
    case ADD:
      return [...state, { level: action.level, data: action.data }];
    default:
      return state;
  }
};

const Results = ({ content }) => {
  const [logsList, updateLogs] = useReducer(logsReducer, emptyLogsList);
  const [iframe, updateIframe] = useState();
  const iframeContainerRef = useRef();

  const fakeConsole = methods.reduce((obj, method) => {
    obj[method] = (...args) => {
      updateLogs({ type: ADD, level: method, data: args });
    };
    return obj;
  }, {});

  const run = () => {
    if (!iframe) {
      let innerFrame;
      innerFrame = document.createElement("iframe");
      innerFrame.src = "./src/runner/index.html";
      innerFrame.onload = () =>
        innerFrame.contentWindow.run(content, fakeConsole);
      iframeContainerRef.current?.appendChild(innerFrame);
      updateIframe(innerFrame);
    } else {
      // wait for actual frame to run so iframe.contentWindow.run has been assigned
      // (see runner/index.js)
      setTimeout(() => {
        updateLogs({ type: CLEAR });
        iframe.onload = () => iframe.contentWindow.run(content, fakeConsole);
        iframe.contentWindow.location.reload();
      });
    }
  };

  useEffect(run, [content]);

  return (
    <>
      <div className="console">
        {logsList.map((log, idx) => (
          <ObjectInspector
            key={idx}
            theme="chromeDark"
            data={log.data.length === 1 ? log.data[0] : log.data}
          />
        ))}
      </div>
      <div className="domPlayground" ref={iframeContainerRef}></div>
    </>
  );
};

export { Results };
