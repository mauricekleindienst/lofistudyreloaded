import React from 'react';
import { Mail, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import styles from '../../../styles/PageLayout.module.css';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Lo-Fi.Study team. We\'d love to hear your feedback, questions, or suggestions about our focus and productivity app.',
  keywords: ['contact', 'support', 'feedback', 'lo-fi study', 'customer service'],
  openGraph: {
    title: 'Contact Us | Lo-Fi.Study',
    description: 'Get in touch with the Lo-Fi.Study team. We\'d love to hear your feedback, questions, or suggestions.',
    url: '/contact',
  },
  twitter: {
    title: 'Contact Us | Lo-Fi.Study',
    description: 'Get in touch with the Lo-Fi.Study team. We\'d love to hear your feedback, questions, or suggestions.',
  },
};

export default function ContactPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={20} />
            Back to Lo-Fi.Study
          </Link>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
            <div className={styles.card}>
            <div className={styles.titleSection}>
              <div className={styles.iconWrapper}>
              <Mail className={styles.iconLarge} />
              </div>
              <h1 className={styles.title}>Contact Us</h1>
              <p className={styles.subtitle}>
              We&apos;d love to hear from you!
              </p>
            </div>

            <div className={styles.content} style={{ textAlign: 'center' }}>
              <p className={styles.text}>
              Join our community on Discord for real-time support and discussions.
              </p>
             
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <iframe
                src="https://discord.com/widget?id=1397139010387709952&theme=dark"
                width="350"
                height="500"
                allowTransparency={true}
                frameBorder="0"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                style={{
                borderRadius: '12px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
                border: 'none',
                }}
              ></iframe>
              </div>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
}
