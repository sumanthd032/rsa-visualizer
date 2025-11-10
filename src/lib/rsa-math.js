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