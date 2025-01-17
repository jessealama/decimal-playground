/*
  This is a file for things we need to declare in the global scope.
  Use only under the greatest duress.
*/

/* global Big, Decimal */

import { SHARED_SINGLE_OPS, SHARED_MIXED_OPS } from "../constants.js";

const Decimal128 = Decimal.clone();

const SINGLE_OPS = Object.assign({}, SHARED_SINGLE_OPS, {
  "+": "add",
  "/": "div",
});

const isDecInstance = (a) => a instanceof Decimal128 || a instanceof Big;

const binaryExpressionHandler = (left, right, op, message) => {
  const leftIsDecimal = isDecInstance(left);
  const rightIsDecimal = isDecInstance(right);

  if (Reflect.has(SHARED_MIXED_OPS, op)) {
    return left[SHARED_MIXED_OPS[op]](right);
  }

  if (leftIsDecimal !== rightIsDecimal) {
    throw new TypeError(message);
  }

  // Now that we've gotten rid of mixed items, we know that whatever is
  // true of left is also true of right
  if (leftIsDecimal) {
    return left[SINGLE_OPS[op]](right);
  }

  // evaluate as normal. (The alternative to this big switch statement is to
  // bring in a dependency like tosource, and use Function('...')() to eval)
  switch (op) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "/":
      return left / right;
    case "%":
      return left % right;
    case "*":
      return left * right;
    case "**":
      return left ** right;
    case "&":
      return left & right;
    case "|":
      return left | right;
    case ">>":
      return left >> right;
    case ">>>":
      return left >>> right;
    case "<<":
      return left << right;
    case "^":
      return left ^ right;
    case "==":
      return left == right;
    case "===":
      return left === right;
    case "!=":
      return left != right;
    case "!==":
      return left !== right;
    case "in":
      return left in right;
    case "instanceof":
      return left instanceof right;
    case ">":
      return left > right;
    case "<":
      return left < right;
    case ">=":
      return left >= right;
    case "<=":
      return left <= right;
    default:
      console.error(`unhandled BinaryExpression operator '${op}'`);
  }
};

const log = (...args) => {
  const updatedArgs = args.map((el) =>
    isDecInstance(el) ? el.toString() : el
  );
  console.log(updatedArgs.join(" "));
};

const wrappedConditionalTest = (a) => {
  if (isDecInstance(a)) {
    return Number(a);
  }

  return a;
};

const wrappedConstructorIdentifier = (a, error) => {
  if (a === null || a === undefined) {
    throw new TypeError(error);
  }

  if (typeof a === "boolean") {
    return Number(a);
  }

  if (typeof a === "bigint") {
    return String(a);
  }

  return a;
};

const unaryEvaluators = {
  "-"(argument) {
    return argument.mul(-1);
  },
};

const wrappedUnaryHandler = (argument, operator, error) => {
  if (!isDecInstance(argument)) {
    // evaluate as normal. (The alternative to this big switch statement is to
    // bring in a dependency like tosource, and use Function('...')() to eval)
    switch (operator) {
      case "void":
        return void argument;
      case "throw":
        throw argument;
      case "!":
        return !argument;
      case "+":
        return +argument;
      case "-":
        return -argument;
      case "~":
        return ~argument;
      case "typeof":
        return typeof argument;
      case "delete":
        // FIXME: delete can't be handled here because if you have an expression
        // like 'delete a.b' then 'a.b' will already be evaluated by the time it
        // gets here, so you can't delete the 'b' property.
        console.log("delete needs to be handled separately");
        return;
      default:
        console.error(`unhandled UnaryExpression operator '${operator}'`);
    }
  }

  if (!Reflect.has(unaryEvaluators, operator)) {
    throw new SyntaxError(error);
  }

  return unaryEvaluators[operator](argument);
};

export default function defineGlobals(global) {
  // These are the names that we pollute the global namespace with.
  // Please avoid adding to this list if possible.
  Object.assign(global, {
    Decimal128,
    isDecInstance,
    binaryExpressionHandler,
    log,
    wrappedConditionalTest,
    wrappedConstructorIdentifier,
    wrappedUnaryHandler,
  });
}
