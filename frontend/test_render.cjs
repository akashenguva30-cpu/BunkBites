const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Mock components and functions
const useNavigate = () => () => {};

// Read the JSX file and compile it
const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('C:\\smart-campus-canteen\\frontend\\src\\pages\\OrderHistory.jsx', 'utf8');

// Strip out imports and add mocks
const modifiedCode = code
  .replace(/import .*/g, '')
  .replace('export default function OrderHistory', 'function OrderHistory')
  + '\nmodule.exports = OrderHistory;';

global.useState = (init) => {
  if (Array.isArray(init)) {
    return [[{
      "id": 2,
      "student": { "id": 5, "username": "student" },
      "totalAmount": 120.00,
      "status": "PLACED",
      "items": [{
        "id": 2,
        "menuItem": { "id": 1, "name": "Chicken Biryani" },
        "quantity": 1,
        "unitPrice": 120.00,
        "subtotal": 120.00
      }],
      "payment": { "method": "UPI", "status": "SUCCESS" },
      "token": { "tokenNumber": "A002" }
    }], () => {}];
  }
  return [init, () => {}];
};
global.useEffect = () => {};
global.useNavigate = () => () => {};

const compiled = babel.transformSync(modifiedCode, {
  presets: ['@babel/preset-react'],
  plugins: ['@babel/plugin-transform-modules-commonjs']
});

fs.writeFileSync('C:\\smart-campus-canteen\\frontend\\src\\pages\\OrderHistory_compiled.cjs', compiled.code);

const OrderHistory = require('C:\\smart-campus-canteen\\frontend\\src\\pages\\OrderHistory_compiled.cjs');

// Mock React hooks
React.useState = (init) => {
  if (Array.isArray(init)) {
    // Provide the exact JSON array we got from the API
    return [[{
      "id": 2,
      "student": { "id": 5, "username": "student" },
      "totalAmount": 120.00,
      "status": "PLACED",
      "items": [{
        "id": 2,
        "menuItem": { "id": 1, "name": "Chicken Biryani" },
        "quantity": 1,
        "unitPrice": 120.00,
        "subtotal": 120.00
      }],
      "payment": { "method": "UPI", "status": "SUCCESS" },
      "token": { "tokenNumber": "A002" }
    }], () => {}];
  }
  return [init, () => {}];
};
React.useEffect = () => {};

try {
  const html = ReactDOMServer.renderToString(React.createElement(OrderHistory));
  console.log("HTML:", html);
} catch (e) {
  console.error("REACT ERROR:", e);
}
