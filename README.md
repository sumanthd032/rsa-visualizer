# Interactive RSA Visualizer

An interactive, educational web application built with React and Tailwind CSS that visually demonstrates the RSA encryption algorithm. The app allows users to step through the entire process — from key generation to encryption and decryption — using small, understandable prime numbers.

## Core Features

### Visualizer Mode
- Key Generation
  - Input your own small prime numbers (p and q) or generate random ones.
  - See live calculation of n (modulus) and φ(n) (Euler's totient).
  - Choose a public exponent e with real-time validation (coprime checks).
  - Compute the private exponent d using the Extended Euclidean Algorithm (d = e⁻¹ mod φ(n)).
- Encryption
  - Input a short plaintext message (e.g., "HI").
  - Convert the message to an integer M.
  - Step through the modular exponentiation (C = Mᵉ mod n) to produce the ciphertext C.
- Decryption
  - Decrypt ciphertext C using the private key.
  - Step through modular exponentiation (M' = Cᵈ mod n) and convert the integer back to plaintext.

### Encrypt/Decrypt Mode
- Generate a 16-bit RSA key pair.
- Copy public and private key components to clipboard.
- Encrypt short plaintext messages using the public key.
- Decrypt ciphertext numbers using the private key.

## Tech Stack
- Frontend: React
- Build Tool: Vite
- Styling: Tailwind CSS
- Animations: Framer Motion
- Icons: Lucide React
- Math: Native JavaScript BigInt for all cryptographic calculations

## Running Locally

Clone the repository (replace with your repository URL):

```bash
git clone https://github.com/sumanthd032/rsa-visualizer.git
cd rsa-visualizer
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The app will be available at: http://localhost:5173