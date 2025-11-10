/**
 * Calculates the Greatest Common Divisor (GCD) of two BigInts.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint} The GCD of a and b.
 */
export const gcd = (a, b) => {
  if (!b) {
    return a;
  }
  return gcd(b, a % b);
};

/**
 * Performs the Extended Euclidean Algorithm.
 * Finds [x, y] such that a*x + b*y = gcd(a, b)
 * @param {bigint} a
 * @param {bigint} b
 * @returns {[bigint, bigint, bigint]} [gcd, x, y]
 */
export const extendedEuclidean = (a, b) => {
  if (b === 0n) {
    return [a, 1n, 0n];
  }
  const [g, x1, y1] = extendedEuclidean(b, a % b);
  const x = y1;
  const y = x1 - (a / b) * y1;
  return [g, x, y];
};

/**
 * Calculates the modular multiplicative inverse of e mod phi.
 * Finds d such that (e * d) % phi = 1
 * @param {bigint} e
 * @param {bigint} phi
 * @returns {bigint} The modular inverse d, or null if no inverse exists.
 */
export const modInverse = (e, phi) => {
  const [g, x] = extendedEuclidean(e, phi);
  if (g !== 1n) {
    // No modular inverse exists
    return null;
  }
  // Make x positive
  return (x % phi + phi) % phi;
};

/**
 * A simple primality test.
 * Sufficient for small numbers in this visualizer.
 * @param {number} num
 * @returns {boolean} True if num is prime, false otherwise.
 */
export const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i = i + 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

/**
 * Generates a random prime number within a given range (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number} A random prime number.
 */
export const generateRandomPrime = (min, max) => {
  let p = 0;
  while (!isPrime(p)) {
    p = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return p;
};

/**
 * Performs modular exponentiation (base^exponent % modulus).
 * (M^e % n) or (C^d % n)
 * @param {bigint} base
 * @param {bigint} exponent
 * @param {bigint} modulus
 * @returns {bigint} The result of (base^exponent) % modulus.
 */
export const modPow = (base, exponent, modulus) => {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> 1n; // equivalent to exponent / 2n
    base = (base * base) % modulus;
  }
  return result;
};

/**
 * Converts a text string to a BigInt.
 * Each character is treated as a byte.
 * @param {string} text The text to encode.
 * @returns {bigint} The resulting BigInt.
 */
export const textToBigInt = (text) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  let result = 0n;
  for (let i = 0; i < encoded.length; i++) {
    result = (result << 8n) + BigInt(encoded[i]);
  }
  return result;
};

/**
 * Converts a BigInt back to a text string.
 * @param {bigint} bigIntValue The BigInt to decode.
 * @returns {string} The resulting text string.
 */
export const bigIntToText = (bigIntValue) => {
  let hexString = bigIntValue.toString(16);
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString; // Ensure even length
  }
  
  const bytes = [];
  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substring(i, i + 2), 16));
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
};

/**
 * Performs modular exponentiation and returns an array of steps for visualization.
 * (base^exponent % modulus)
 * @param {bigint} base
 * @param {bigint} exponent
 * @param {bigint} modulus
 * @returns {{steps: Array<string>, result: bigint}} An object containing the steps and the final result.
 */
export const modPowWithSteps = (base, exponent, modulus) => {
  const steps = [];
  if (modulus === 1n) return { steps: ["Modulus is 1, result is 0."], result: 0n };

  let result = 1n;
  let b = base % modulus;
  let exp = exponent;
  const binaryExp = exp.toString(2);
  steps.push(`Calculating (base ^ exponent) % modulus`);
  steps.push(`(${base} ^ ${exponent}) % ${modulus}`);
  steps.push(`Exponent in binary: ${binaryExp}`);
  steps.push("---");
  steps.push(`Initialize result = 1n`);

  for (let i = binaryExp.length - 1; i >= 0; i--) {
    const bit = binaryExp[i];
    steps.push(`\nBit ${binaryExp.length - 1 - i} (from right) = ${bit}`);
    
    if (bit === '1') {
      steps.push(`Bit is 1: result = (result * base) % modulus`);
      steps.push(`result = (${result} * ${b}) % ${modulus} = ${(result * b) % modulus}`);
      result = (result * b) % modulus;
    } else {
      steps.push(`Bit is 0: result remains ${result}`);
    }

    if (i > 0) {
      steps.push(`Square base: base = (base * base) % modulus`);
      steps.push(`base = (${b} * ${b}) % ${modulus} = ${(b * b) % modulus}`);
      b = (b * b) % modulus;
    }
  }
  
  steps.push("---");
  steps.push(`Final exponent bit processed. Result = ${result}`);

  return { steps, result };
};