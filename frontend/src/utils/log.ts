const NODE_ENV = process.env.NODE_ENV;
export const isDEV = NODE_ENV === 'development';

export const tlog = isDEV
  ? Function.prototype.bind.call(console.log, console)
  : () => {
      // doNothing
    };
