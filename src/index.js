import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "../src/assets/css/styles.css";
import "../src/assets/css/framework.css";
import App from "./App";
import "antd/dist/antd.css";
import { Provider } from "react-redux";
import { store } from "./store/index";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
