/**
 * Database Debug Panel
 * Temporary component to test and debug database connections
 * Add this to your main page during development
 */

"use client";

import React, { useState, useEffect } from 'react';
import { dbMonitor } from '../lib/databaseMonitor';

interface DiagnosticsResult {
  connection: boolean;
  tables: { success: boolean; missing: string[] };
  crud: { success: boolean; errors: string[] };
  auth: { authenticated: boolean; error?: string };
  recommendations: string[];
}

export default function DatabaseDebugPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const results = await dbMonitor.runFullDiagnostic();
      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on mount
    runDiagnostics();
  }, []);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ff6b35',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 10000
        }}
      >
        🔧 DB Debug
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      fontSize: '12px',
      zIndex: 10000,
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Database Diagnostics</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <button 
        onClick={runDiagnostics}
        disabled={isLoading}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '15px',
          width: '100%'
        }}
      >
        {isLoading ? 'Running...' : 'Run Diagnostics'}
      </button>

      {diagnostics && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Connection:</strong> 
            <span style={{ color: diagnostics.connection ? '#4CAF50' : '#f44336' }}>
              {diagnostics.connection ? ' ✓ Connected' : ' ✗ Failed'}
            </span>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Tables:</strong> 
            <span style={{ color: diagnostics.tables.success ? '#4CAF50' : '#f44336' }}>
              {diagnostics.tables.success ? ' ✓ All present' : ` ✗ Missing: ${diagnostics.tables.missing.join(', ')}`}
            </span>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>CRUD Operations:</strong> 
            <span style={{ color: diagnostics.crud.success ? '#4CAF50' : '#f44336' }}>
              {diagnostics.crud.success ? ' ✓ Working' : ' ✗ Failed'}
            </span>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <strong>Authentication:</strong> 
            <span style={{ color: diagnostics.auth.authenticated ? '#4CAF50' : '#FFA500' }}>
              {diagnostics.auth.authenticated ? ' ✓ Authenticated' : ' ⚠ Not authenticated'}
            </span>
          </div>

          {diagnostics.crud.errors.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Errors:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#f44336' }}>
                {diagnostics.crud.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnostics.recommendations.length > 0 && (
            <div>
              <strong>Recommendations:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#FFA500' }}>
                {diagnostics.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
