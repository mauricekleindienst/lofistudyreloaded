"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Delete } from 'lucide-react';
import calculatorStyles from '../../../styles/Calculator.module.css';

type Op = '+' | '-' | '×' | '÷';

const calculate = (a: number, b: number, op: Op): number => {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
  }
};

// Trim float noise (0.1 + 0.2) and keep long results readable.
const format = (n: number): string => {
  if (!Number.isFinite(n)) return 'Error';
  const rounded = parseFloat(n.toPrecision(12));
  const text = String(rounded);
  return text.length > 14 ? rounded.toExponential(6) : text;
};

const CalcButton: React.FC<{ onClick: () => void; className?: string; label?: string; children: React.ReactNode }> = ({
  onClick,
  className = '',
  label,
  children,
}) => (
  <button type="button" onClick={onClick} className={`${calculatorStyles.key} ${className}`} aria-label={label}>
    {children}
  </button>
);

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Op | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const inputNumber = useCallback((digit: string) => {
    if (waitingForNewValue || display === 'Error') {
      setDisplay(digit === '.' ? '0.' : digit);
      setWaitingForNewValue(false);
      return;
    }
    if (digit === '.' && display.includes('.')) return;
    if (display.replace(/[-.]/g, '').length >= 15) return;
    setDisplay(display === '0' && digit !== '.' ? digit : display + digit);
  }, [display, waitingForNewValue]);

  const inputOperation = useCallback((next: Op) => {
    if (display === 'Error') return;
    const inputValue = parseFloat(display);
    // Pressing a different operator right after another one just swaps it.
    if (operation && waitingForNewValue) {
      setOperation(next);
      return;
    }
    if (previousValue === null || !operation) {
      setPreviousValue(inputValue);
    } else {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(format(result));
      setPreviousValue(Number.isFinite(result) ? result : null);
    }
    setWaitingForNewValue(true);
    setOperation(next);
  }, [display, operation, previousValue, waitingForNewValue]);

  const performCalculation = useCallback(() => {
    if (previousValue === null || !operation) return;
    setDisplay(format(calculate(previousValue, parseFloat(display), operation)));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(true);
  }, [display, operation, previousValue]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  }, []);

  const deleteDigit = useCallback(() => {
    if (waitingForNewValue || display === 'Error') return;
    const next = display.slice(0, -1);
    setDisplay(next === '' || next === '-' ? '0' : next);
  }, [display, waitingForNewValue]);

  // Keyboard support while the calculator window has focus or the pointer is over it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root || !(root.contains(document.activeElement) || root.matches(':hover'))) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      const k = e.key;
      if (/^[0-9.]$/.test(k)) inputNumber(k);
      else if (k === ',') inputNumber('.');
      else if (k === '+' || k === '-') inputOperation(k);
      else if (k === '*' || k === 'x') inputOperation('×');
      else if (k === '/') inputOperation('÷');
      else if (k === 'Enter' || k === '=') performCalculation();
      else if (k === 'Backspace') deleteDigit();
      else if (k === 'Escape' || k === 'Delete' || k.toLowerCase() === 'c') clear();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [inputNumber, inputOperation, performCalculation, deleteDigit, clear]);


  const toggleSign = () => {
    if (display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
  };

  const op = (o: Op, label: string = o) => (
    <CalcButton
      onClick={() => inputOperation(o)}
      className={`${calculatorStyles.op} ${operation === o && waitingForNewValue ? calculatorStyles.opActive : ''}`}
      label={label === '-' ? 'Minus' : label}
    >
      {o === '-' ? '−' : o}
    </CalcButton>
  );
  const num = (d: string) => (
    <CalcButton onClick={() => inputNumber(d)} className={d === '0' ? calculatorStyles.wide : ''}>
      {d}
    </CalcButton>
  );

  return (
    <div className={calculatorStyles.calc} ref={rootRef} tabIndex={-1}>
      <div className={calculatorStyles.screen}>
        <div className={calculatorStyles.expression} aria-hidden>
          {previousValue !== null && operation ? `${format(previousValue)} ${operation === '-' ? '−' : operation}` : '\u00a0'}
        </div>
        <output className={calculatorStyles.result} aria-live="polite">
          {display}
        </output>
      </div>

      <div className={calculatorStyles.keys}>
        <CalcButton onClick={clear} className={calculatorStyles.fn} label="Clear">
          C
        </CalcButton>
        <CalcButton onClick={toggleSign} className={calculatorStyles.fn} label="Toggle sign">
          ±
        </CalcButton>
        <CalcButton onClick={deleteDigit} className={calculatorStyles.fn} label="Delete last digit">
          <Delete size={18} />
        </CalcButton>
        {op('÷', 'Divide')}
        {num('7')}
        {num('8')}
        {num('9')}
        {op('×', 'Multiply')}
        {num('4')}
        {num('5')}
        {num('6')}
        {op('-')}
        {num('1')}
        {num('2')}
        {num('3')}
        {op('+', 'Plus')}
        {num('0')}
        {num('.')}
        <CalcButton onClick={performCalculation} className={calculatorStyles.equals} label="Equals">
          =
        </CalcButton>
      </div>
    </div>
  );
};

export default Calculator;
