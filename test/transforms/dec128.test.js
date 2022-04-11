import pluginTester from "babel-plugin-tester";
import pluginDec128 from "../../transforms/dec128.js";

const basic = {
  "transforms literal": {
    code: "1000.2m",
    output: 'Decimal("1000.2");',
  },
  "transforms literal without point": {
    code: "1000m",
    output: 'Decimal("1000");',
  },
  "transforms literal with point at end": {
    code: "1000.m",
    output: 'Decimal("1000.");',
  },
};

const doesNotChangeNumbers = {
  "does not change Numbers": "111.4 + 12 - 22;",
  "does not change Numbers in nested BinaryExpressions":
    "(1 + (4 - 2)) * (3 + 4);",
};

const operators = {
  "converts + to .add()": {
    code: "10.3m + 12.4m",
    output: 'Decimal("10.3").add(Decimal("12.4"));',
  },
  "converts - to .sub()": {
    code: "10.3m - 12.4m",
    output: 'Decimal("10.3").sub(Decimal("12.4"));',
  },
  "converts * to .mult()": {
    code: "10.3m * 12.4m",
    output: 'Decimal("10.3").mul(Decimal("12.4"));',
  },
  "converts / to .div()": {
    code: "10.3m / 12.4m",
    output: 'Decimal("10.3").div(Decimal("12.4"));',
  },
  "converts unary - to .neg()": {
    code: "-10.3m + -12.4m",
    output: 'Decimal("10.3").neg().add(Decimal("12.4").neg());',
  },
};

const nestedOutput = `
  Decimal("0.4").add(
    Decimal("11.3").sub(Decimal("89").mul(Decimal("10").div(Decimal("33.45"))))
  );
`;

const longNestedOutput = `
  Decimal(\"21.3\")
    .mul(Decimal("0.4").add(Decimal("11.3")))
    .sub(Decimal("10").mul(Decimal("10000.").add(Decimal("90"))))
    .sub(Decimal("80"))
    .add(Decimal("35.67").mul(Decimal("103429.642950")))
    .add(Decimal("21.3").mul(Decimal("0.4").add(Decimal("11.3"))))
    .sub(Decimal("10").mul(Decimal("10000.")))
    .add(Decimal("90"))
    .sub(Decimal("80"))
    .add(Decimal("35.67").mul(Decimal("103429.642950")));
`;

const inBinaryExpressions = {
  "transforms nested BinaryExpressions without parens": {
    code: "0.4m + 11.3m + 89m;",
    output: 'Decimal("0.4").add(Decimal("11.3")).add(Decimal("89"));',
  },
  "transforms nested BinaryExpressions with parens": {
    code: "0.4m + (11.3m - 89m * (10m / 33.45m));",
    output: nestedOutput,
  },
  "transforms long nested BinaryExpressions": {
    code: "21.3m * (0.4m + 11.3m) - (10m * (10000.m + 90m)) - 80m + 35.67m * 103429.642950m + 21.3m * (0.4m + 11.3m) - 10m * 10000.m + 90m - 80m + 35.67m * 103429.642950m ;",
    output: longNestedOutput,
  },
  "transforms negation of expression": {
    code: "-(0.001m + 17.6m)",
    output: 'Decimal("0.001").add(Decimal("17.6")).neg();',
  },
};

const inFunctions = {
  "works with implicit return arrow function": {
    code: "const addToADecimal = (x) => x + 12.6m;",
    output: "const addToADecimal = (x) => x + Decimal(12.6);",
  },
};

const longDecimalRoundOutput = `
  Decimal.round(Decimal("1.5"), {
    roundingMode: "up",
    maximumFractionDigits: 0,
  }).neg();
`;

const withKnownDecimalInputs = {
  "works with Decimal.round": {
    code: '-Decimal.round(1.5m, { roundingMode: "up", maximumFractionDigits: 0 });',
    output: longDecimalRoundOutput,
  },
  "unary Math method with known decimal input is known to be decimal": {
    code: "-Math.abs(-1.5m);",
    output: 'Math.abs(Decimal("1.5").neg()).neg();',
  },
  "unary Math method with known non-decimal input is not transformed": {
    code: "-Math.abs(-1.5);",
    output: "-Math.abs(-1.5);",
  },
  "n-ary Math method with known decimal inputs is known to be decimal": {
    code: "-Math.pow(1.01m, 12m);",
    output: 'Math.pow(Decimal("1.01"), Decimal("12")).neg();',
  },
  "n-ary Math method with known non-decimal inputs is not transformed": {
    code: "-Math.pow(1.01, 12);",
    output: "-Math.pow(1.01, 12);",
  },
  "n-ary math method with mixed inputs is not transformed": {
    code: "-Math.pow(1.01m, 12);",
    output: '-Math.pow(Decimal("1.01"), 12);',
  },
};

pluginTester({
  plugin: pluginDec128,
  pluginName: "plugin-decimal-128",
  tests: {
    ...basic,
    ...operators,
    ...inBinaryExpressions,
    ...inFunctions,
    ...doesNotChangeNumbers,
    ...withKnownDecimalInputs,
  },
});
