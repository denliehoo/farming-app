import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";

import { connectWalletReducer } from "../reducers/connectWalletReducer";

const rootReducer = combineReducers({
  connectWalletReducer: connectWalletReducer,
});

let store = createStore(rootReducer, applyMiddleware(thunk));

export { store };
