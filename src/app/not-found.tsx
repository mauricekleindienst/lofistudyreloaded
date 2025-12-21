import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: 'white',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3.75rem', fontWeight: 'bold', color: '#ff7b00', marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem', maxWidth: '28rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#ff7b00',
          color: 'white',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
      >
        Return Home
      </Link>
    </div>
  );
}
