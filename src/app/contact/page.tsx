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
                We&apos;d love to hear from you! Get in touch with any questions, feedback, or suggestions.
              </p>
            </div>

            <div className={styles.content}>
              {/* Email Contact */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Mail className={`${styles.iconMedium} ${styles.iconBlue}`} />
                  <h2 className={styles.sectionTitle}>Email Support</h2>
                </div>
                <div className={styles.sectionCard}>
                
                  <a href="mailto:hello@lo-fi.study" className={styles.contactLink}>
                    <Mail size={16} />
                    hello@lo-fi.study
                  </a>
                </div>
              </section>
              
              {/* Feedback */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <MessageCircle className={`${styles.iconMedium} ${styles.iconPurple}`} />
                  <h2 className={styles.sectionTitle}>Feedback & Suggestions</h2>
                </div>
                <div className={styles.sectionCard}>
                  
                  <a href="mailto:feedback@lo-fi.study" className={styles.contactLink}>
                    <MessageCircle size={16} />
                    feedback@lo-fi.study
                  </a>
                </div>
              </section>

            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
