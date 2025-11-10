import React, { useState, useMemo } from 'react';
import { Lock, Unlock, KeyRound, Brain, Shuffle, Play, Check, X, Copy, Zap, ArrowDown, Hash, MessageSquare, Binary, Eye } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn } from './lib/utils';
// Import new math functions
import { gcd, modInverse, generateRandomPrime, isPrime, textToBigInt, bigIntToText, modPowWithSteps } from './lib/rsa-math.js';

// --- Main App Component ---

export default function App() {
  const [mode, setMode] = useState('visualizer'); // 'visualizer' or 'encryptor'

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-gray-900 text-gray-100 font-sans p-4 md:p-8">
      <Header />
      <ModeToggle mode={mode} setMode={setMode} />
      
      <main className="w-full max-w-6xl mt-8">
        <AnimatePresence mode="wait">
          {mode === 'visualizer' && (
            <motion.div
              key="visualizer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              {/* This new container holds state for all visualizer cards */}
              <VisualizerModeContainer />
            </motion.div>
          )}

          {mode === 'encryptor' && (
            <motion.div
              key="encryptor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EncryptorDecryptor />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <Footer />
    </div>
  );
}

// --- Layout Components (unchanged) ---

function Header() {
  return (
    <header className="w-full max-w-6xl text-center mb-4">
      <div className="flex items-center justify-center gap-3 mb-2">
        <KeyRound className="w-10 h-10 text-cyan-400" />
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Interactive RSA Visualizer
        </h1>
      </div>
      <p className="text-lg md:text-xl text-gray-400">
        Learn, generate, and encrypt with the RSA algorithm step-by-step.
      </p>
    </header>
  );
}

function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
      <ToggleButton
        onClick={() => setMode('visualizer')}
        isActive={mode === 'visualizer'}
        icon={<Brain className="w-5 h-5" />}
        label="Visualizer Mode"
      />
      <ToggleButton
        onClick={() => setMode('encryptor')}
        isActive={mode === 'encryptor'}
        icon={<Lock className="w-5 h-5" />}
        label="Encrypt/Decrypt Mode"
      />
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full max-w-6xl mt-12 text-center text-gray-500">
      <p>A project to make cryptography intuitive and accessible.</p>
    </footer>
  );
}

// --- NEW State Container ---

/**
 * This component now holds all the shared state for the
 * visualizer mode, including keys and calculation steps.
 */
function VisualizerModeContainer() {
  // --- Key Generation State (Lifted) ---
  const [p, setP] = useState('');
  const [q, setQ] = useState('');
  const [e, setE] = useState('');
  const [n, setN] = useState(null);
  const [phi, setPhi] = useState(null);
  const [d, setD] = useState(null);
  
  // --- Key Generation UI State ---
  const [pError, setPError] = useState(null);
  const [qError, setQError] = useState(null);
  const [eError, setEError] = useState(null);
  const [keyGenSteps, setKeyGenSteps] = useState([]);
  const [currentKeyGenStep, setCurrentKeyGenStep] = useState(0);

  // --- Encryption State ---
  const [plaintext, setPlaintext] = useState('');
  const [messageInt, setMessageInt] = useState(null); // M
  const [ciphertext, setCiphertext] = useState(null); // C
  const [encryptionSteps, setEncryptionSteps] = useState([]);

  // --- Decryption State (New) ---
  const [decryptedMessageInt, setDecryptedMessageInt] = useState(null); // M'
  const [decryptedPlaintext, setDecryptedPlaintext] = useState('');
  const [decryptionSteps, setDecryptionSteps] = useState([]);

  // --- Derived State ---
  const isKeyGenerationReady = p && q && !pError && !qError;
  const isKeyReady = n && e && d && phi;

  // --- Handlers for Key Generation ---
  
  const handleGeneratePrimes = () => {
    const pVal = generateRandomPrime(10, 50);
    let qVal = generateRandomPrime(10, 50);
    while (pVal === qVal) {
      qVal = generateRandomPrime(10, 50);
    }
    setP(pVal.toString());
    setQ(qVal.toString());
    validateP(pVal.toString(), qVal.toString()); // Pass q for cross-validation
    validateQ(qVal.toString(), pVal.toString()); // Pass p for cross-validation
    resetCalculations();
  };

  const handleGenerateKeys = () => {
    const pVal = BigInt(p);
    const qVal = BigInt(q);
    
    if (!validateP(p, q) || !validateQ(q, p)) return;
    
    const nCalc = pVal * qVal;
    const phiCalc = (pVal - 1n) * (qVal - 1n);
    
    setN(nCalc);
    setPhi(phiCalc);
    
    if (!e || !validateE(e, phiCalc)) {
      // If e is not set or invalid, stop here
      if (!e) setEError('e is required.');
      return;
    }
    
    const eVal = BigInt(e);
    const dCalc = modInverse(eVal, phiCalc);
    setD(dCalc);
    
    setKeyGenSteps([
      { title: 'Calculate n', value: `n = p * q = ${p} * ${q} = ${nCalc}` },
      { title: 'Calculate φ(n)', value: `φ(n) = (p-1) * (q-1) = ${pVal - 1n} * ${qVal - 1n} = ${phiCalc}` },
      { title: 'Public Exponent e', value: `Chosen e = ${eVal}. GCD(e, φ(n)) = GCD(${eVal}, ${phiCalc}) = 1` },
      { title: 'Private Exponent d', value: `d = e⁻¹ mod φ(n) = ${eVal}⁻¹ mod ${phiCalc} = ${dCalc}` },
    ]);
    setCurrentKeyGenStep(0);
  };

  // --- Reset Handlers (Updated) ---

  const resetCalculations = () => {
    setN(null);
    setPhi(null);
    setE('');
    setD(null);
    setEError(null);
    setKeyGenSteps([]);
    setCurrentKeyGenStep(0);
    // Reset encryption & decryption as well
    resetEncryption();
  };
  
  const resetEncryption = () => {
    setPlaintext('');
    setMessageInt(null);
    setCiphertext(null);
    setEncryptionSteps([]);
    resetDecryption(); // Chain the reset
  }
  
  const resetDecryption = () => {
    setDecryptedMessageInt(null);
    setDecryptedPlaintext('');
    setDecryptionSteps([]);
  }

  // --- Validation (Slightly modified) ---

  const validateP = (pVal, qVal) => {
    if (pVal === '') { setPError('Prime p is required.'); return false; }
    const num = Number(pVal);
    if (!isPrime(num)) { setPError('p must be a prime number.'); return false; }
    if (qVal && pVal === qVal) { setPError('p and q must be different.'); return false; }
    setPError(null);
    return true;
  };

  const validateQ = (qVal, pVal) => {
    if (qVal === '') { setQError('Prime q is required.'); return false; }
    const num = Number(qVal);
    if (!isPrime(num)) { setQError('q must be a prime number.'); return false; }
    if (pVal && qVal === pVal) { setQError('p and q must be different.'); return false; }
    setQError(null);
    return true;
  };
  
  const validateE = (val, currentPhi) => {
    if (val === '') { setEError('e is required.'); return false; }
    if (!currentPhi) { setEError(null); return true; } // Can't validate yet
    const eVal = BigInt(val);
    if (eVal <= 1n || eVal >= currentPhi) {
      setEError(`e must be between 1 and φ(n) (${currentPhi}).`); return false;
    }
    if (gcd(eVal, currentPhi) !== 1n) {
      setEError('e must be coprime with φ(n).'); return false;
    }
    setEError(null);
    return true;
  };
  
  // --- Handlers for Encryption ---

  const handleEncrypt = () => {
    resetDecryption(); // Clear old decryption results
    if (!plaintext || !isKeyReady) return;
    
    // 1. Convert plaintext to message integer M
    const mVal = textToBigInt(plaintext);
    
    if (mVal >= n) {
      setEncryptionSteps([
        { title: 'Error', value: 'Message integer (M) is larger than n.' },
        { title: 'M', value: `${mVal}` },
        { title: 'n', value: `${n}` },
        { title: 'Info', value: 'Use a shorter message or larger primes (p, q).' }
      ]);
      setMessageInt(mVal);
      setCiphertext(null);
      return;
    }
    
    setMessageInt(mVal);
    
    // 2. Calculate Ciphertext C = M^e mod n
    const { steps, result } = modPowWithSteps(mVal, BigInt(e), n);
    
    setCiphertext(result);
    
    // 3. Set visualization steps
    const finalSteps = [
      { title: 'Convert Text to Integer (M)', value: `"${plaintext}" → ${mVal}` },
      { title: 'Encryption Formula', value: `C = Mᵉ mod n` },
      { title: 'Calculation', value: `C = ${mVal}^${e} mod ${n}` },
      { title: 'Modular Exponentiation', value: `See steps below...`, stepsLog: steps },
      { title: 'Ciphertext (C)', value: `${result}` }
    ];
    setEncryptionSteps(finalSteps);
  };
  
  // --- Handlers for Decryption (New) ---
  const handleDecrypt = () => {
    if (ciphertext === null || !isKeyReady) return;

    // 1. Calculate Decrypted Message M' = C^d mod n
    const { steps, result } = modPowWithSteps(ciphertext, d, n);
    
    setDecryptedMessageInt(result);

    // 2. Convert integer back to text
    const M_prime_text = bigIntToText(result);
    setDecryptedPlaintext(M_prime_text);

    // 3. Set visualization steps
    const finalSteps = [
      { title: 'Decryption Formula', value: `M' = Cᵈ mod n` },
      { title: 'Calculation', value: `M' = ${ciphertext}^${d} mod ${n}` },
      { title: 'Modular Exponentiation', value: `See steps below...`, stepsLog: steps },
      { title: 'Decrypted Integer (M\')', value: `${result}` },
      { title: 'Convert Integer to Text', value: `${result} → "${M_prime_text}"` }
    ];
    setDecryptionSteps(finalSteps);
  };

  // --- Render Method ---
  return (
    <>
      <KeyGenerationVisualizer
        // Pass state down
        p={p} setP={setP} pError={pError}
        q={q} setQ={setQ} qError={qError}
        e={e} setE={setE} eError={eError}
        n={n} phi={phi} d={d}
        steps={keyGenSteps} currentStep={currentKeyGenStep}
        isKeyGenerationReady={isKeyGenerationReady}
        // Pass handlers down
        handleGeneratePrimes={handleGeneratePrimes}
        handleGenerateKeys={handleGenerateKeys}
        resetCalculations={resetCalculations}
        validateP={validateP}
        validateQ={validateQ}
        validateE={validateE}
      />
      
      <AnimatePresence>
        {isKeyReady && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EncryptionVisualizer
              n={n}
              e={e}
              plaintext={plaintext}
              setPlaintext={setPlaintext}
              messageInt={messageInt}
              ciphertext={ciphertext}
              encryptionSteps={encryptionSteps}
              handleEncrypt={handleEncrypt}
              resetEncryption={resetEncryption}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- NEW Decryption Card --- */}
      <AnimatePresence>
        {isKeyReady && ciphertext !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DecryptionVisualizer
              n={n}
              d={d}
              ciphertext={ciphertext}
              decryptedMessageInt={decryptedMessageInt}
              decryptedPlaintext={decryptedPlaintext}
              decryptionSteps={decryptionSteps}
              handleDecrypt={handleDecrypt}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


// --- Core Components ---

/**
 * KeyGenerationVisualizer
 */
function KeyGenerationVisualizer({
  p, setP, pError,
  q, setQ, qError,
  e, setE, eError,
  n, phi, d,
  steps, currentStep,
  isKeyGenerationReady,
  handleGeneratePrimes,
  handleGenerateKeys,
  resetCalculations,
  validateP,
  validateQ,
  validateE
}) {
  
  // Local handlers that call the lifted state handlers
  const onPChange = (val) => {
    setP(val);
    validateP(val, q);
    resetCalculations();
  };
  
  const onQChange = (val) => {
    setQ(val);
    validateQ(val, p);
    resetCalculations();
  };

  const onEChange = (val) => {
    setE(val);
    validateE(val, phi);
  };

  return (
    <Card>
      <CardHeader
        icon={<KeyRound className="w-6 h-6" />}
        title="1. RSA Key Generation"
        subtitle="Generate the Public and Private keys."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        
        {/* --- LEFT COLUMN (INPUTS) --- */}
        <div className="flex flex-col gap-6">
          <InputBox
            label="Prime p"
            value={p}
            onChange={onPChange}
            placeholder="e.g., 17"
            error={pError}
            icon={<Shuffle onClick={handleGeneratePrimes} className="cursor-pointer hover:text-cyan-400" />}
          />
          <InputBox
            label="Prime q"
            value={q}
            onChange={onQChange}
            placeholder="e.g., 19"
            error={qError}
            icon={<Shuffle onClick={handleGeneratePrimes} className="cursor-pointer hover:text-cyan-400" />}
          />
          
          <AnimatePresence>
            {isKeyGenerationReady && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <InputBox
                  label="Public Exponent e"
                  value={e}
                  onChange={onEChange}
                  placeholder="e.g., 65537 (or 3, 5, 17)"
                  error={eError}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            onClick={handleGenerateKeys}
            disabled={!p || !q || !e}
            className="w-full"
          >
            <Zap className="w-5 h-5" />
            Generate Keys
          </Button>
        </div>
        
        {/* --- RIGHT COLUMN (OUTPUTS) --- */}
        <div className="flex flex-col gap-4">
          <ValueBox label="Modulus n" value={n} formula="n = p * q" />
          <ValueBox label="Euler's Totient φ(n)" value={phi} formula="φ(n) = (p-1) * (q-1)" />
          
          <div className="flex flex-col p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Public Key (PU)</h4>
            <div className="flex gap-4">
              <ValueBox label="n" value={n} className="flex-1" />
              <ValueBox label="e" value={e} className="flex-1" />
            </div>
          </div>
          
          <div className="flex flex-col p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Private Key (PR)</h4>
            <div className="flex gap-4">
              <ValueBox label="n" value={n} className="flex-1" />
              <ValuedBox label="d" value={d} className="flex-1" formula="d = e⁻¹ mod φ(n)" />
            </div>
          </div>
        </div>
      </div>
      
      {steps.length > 0 && (
        <div className="p-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">Step-by-Step Calculation</h3>
          <div className="flex flex-col gap-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border",
                  index === currentStep ? "border-cyan-500 bg-cyan-900/20" : "border-gray-700 bg-gray-800/50"
                )}
              >
                <span className="font-semibold text-gray-200">{step.title}: </span>
                <span className="font-mono text-cyan-300">{step.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Encryption Visualizer Component
 */
function EncryptionVisualizer({
  n, e,
  plaintext, setPlaintext,
  messageInt, ciphertext,
  encryptionSteps,
  handleEncrypt,
  resetEncryption
}) {

  return (
    <Card>
      <CardHeader
        icon={<Lock className="w-6 h-6" />}
        title="2. Encryption Visualizer"
        subtitle="Encrypt a message with the Public Key."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        
        {/* --- LEFT COLUMN (INPUTS) --- */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-300 mb-1.5">Plaintext Message (M)</label>
            <div className="relative">
              <input
                type="text"
                value={plaintext}
                onChange={(e) => {
                  setPlaintext(e.target.value);
                  resetEncryption(); // Clear old results if text changes
                }}
                placeholder="e.g., HI"
                className="w-full bg-gray-900 border text-gray-100 rounded-lg p-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors border-gray-700"
              />
              <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/small-5 h-5" />
            </div>
          </div>
          
          <Button
            onClick={handleEncrypt}
            disabled={!plaintext || !n || !e}
            className="w-full"
          >
            <Zap className="w-5 h-5" />
            Encrypt & Visualize
          </Button>
        </div>
        
        {/* --- RIGHT COLUMN (OUTPUTS) --- */}
        <div className="flex flex-col gap-4">
          <ValueBox
            label="Message Integer (M)"
            value={messageInt}
            formula="text → integer"
            icon={<Hash className="w-4 h-4 text-gray-500" />}
          />
          <ValueBox
            label="Ciphertext (C)"
            value={ciphertext}
            formula="C = Mᵉ mod n"
            icon={<Binary className="w-4 h-4 text-gray-500" />}
          />
        </div>
      </div>
      
      {/* --- STEP-BY-STEP VISUALIZER --- */}
      {encryptionSteps.length > 0 && (
        <div className="p-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">Encryption Steps</h3>
          <div className="flex flex-col gap-2">
            {encryptionSteps.map((step, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-gray-700 bg-gray-800/50"
              >
                <span className="font-semibold text-gray-200">{step.title}: </span>
                <span className="font-mono text-cyan-300">{step.value}</span>
                {/* Special rendering for the detailed modPow log */}
                {step.stepsLog && (
                  <pre className="mt-3 p-3 bg-gray-900 rounded-md text-xs text-gray-400 overflow-x-auto font-mono">
                    {step.stepsLog.join('\n')}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * --- NEW Decryption Visualizer Component ---
 */
function DecryptionVisualizer({
  n, d,
  ciphertext,
  decryptedMessageInt,
  decryptedPlaintext,
  decryptionSteps,
  handleDecrypt
}) {

  return (
    <Card>
      <CardHeader
        icon={<Unlock className="w-6 h-6" />}
        title="3. Decryption Visualizer"
        subtitle="Decrypt the ciphertext with the Private Key."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        
        {/* --- LEFT COLUMN (INPUTS) --- */}
        <div className="flex flex-col gap-6">
          <ValueBox
            label="Ciphertext (C) to Decrypt"
            value={ciphertext}
            formula="From step 2"
            icon={<Binary className="w-4 h-4 text-gray-500" />}
          />
          
          <Button
            onClick={handleDecrypt}
            disabled={ciphertext === null || !n || !d}
            className="w-full"
          >
            <Zap className="w-5 h-5" />
            Decrypt & Visualize
          </Button>
        </div>
        
        {/* --- RIGHT COLUMN (OUTPUTS) --- */}
        <div className="flex flex-col gap-4">
          <ValueBox
            label="Decrypted Integer (M')"
            value={decryptedMessageInt}
            formula="M' = Cᵈ mod n"
            icon={<Hash className="w-4 h-4 text-gray-500" />}
          />
          <ValueBox
            label="Decrypted Plaintext"
            value={decryptedPlaintext ? `"${decryptedPlaintext}"` : '...'}
            formula="integer → text"
            icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
          />
        </div>
      </div>
      
      {/* --- STEP-BY-STEP VISUALIZER --- */}
      {decryptionSteps.length > 0 && (
        <div className="p-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">Decryption Steps</h3>
          <div className="flex flex-col gap-2">
            {decryptionSteps.map((step, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-gray-700 bg-gray-800/50"
              >
                <span className="font-semibold text-gray-200">{step.title}: </span>
                <span className="font-mono text-cyan-300">{step.value}</span>
                {step.stepsLog && (
                  <pre className="mt-3 p-3 bg-gray-900 rounded-md text-xs text-gray-400 overflow-x-auto font-mono">
                    {step.stepsLog.join('\n')}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}


// Placeholder for Encryptor/Decryptor (unchanged)
function EncryptorDecryptor() {
  return (
    <Card>
      <CardHeader
        icon={<Lock className="w-6 h-6" />}
        title="Encrypt/Decrypt Mode"
        subtitle="Use a generated key pair to encrypt and decrypt messages."
      />
      <div className="p-6">
        <p className="text-gray-400 text-center">
          This section will be built in the next steps!
        </p>
      </div>
    </Card>
  );
}


// --- Reusable UI Components (ValueBox updated, others unchanged) ---

function Card({ children }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
      {children}
    </div>
  );
}

function CardHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-gray-900/50 border-b border-gray-700">
      <div className="flex-shrink-0 p-3 bg-gray-800 rounded-lg border border-gray-700 text-cyan-400">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function InputBox({ label, value, onChange, placeholder, error, icon }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-gray-900 border text-gray-100 rounded-lg p-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors",
            error ? "border-red-500 focus:ring-red-500" : "border-gray-700"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
          {error ? <X className="w-5 h-5 text-red-500" /> : icon ? icon : <Check className="w-5 h-5 text-green-500" />}
        </div>
      </div>
      {error && <p className="text-sm text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

// Updated to include an optional icon
function ValueBox({ label, value, formula, className, icon }) {
  const displayValue = value !== null ? value.toString() : '...';
  
  return (
    <div className={cn("flex flex-col p-3 bg-gray-900 rounded-lg border border-gray-700", className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <label className="text-sm font-medium text-gray-400">{label}</label>
        </div>
        {formula && <span className="text-xs font-mono text-gray-500">{formula}</span>}
      </div>
      <p className="text-xl font-bold font-mono text-cyan-300 mt-1 truncate">
        {displayValue}
      </p>
    </div>
  );
}

function ValuedBox({ label, value, formula, className }) {
  const [copied, setCopied] =useState(false);
  const displayValue = value !== null ? value.toString() : '...';
  
  const handleCopy = () => {
    if (value !== null) {
      navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("flex flex-col p-3 bg-gray-900 rounded-lg border border-gray-700", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        {formula && <span className="text-xs font-mono text-gray-500">{formula}</span>}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xl font-bold font-mono text-cyan-300 truncate">
          {displayValue}
        </p>
        <button onClick={handleCopy} className="text-gray-500 hover:text-cyan-400 flex-shrink-0">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Button({ onClick, children, className, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 p-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all",
        "disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

function ToggleButton({ onClick, isActive, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
        isActive ? "text-cyan-300" : "text-gray-400 hover:text-white"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-toggle"
          className="absolute inset-0 bg-cyan-800/50 rounded-md"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  );
}