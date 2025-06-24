import React from 'react';
import { Mail, ArrowLeft, Globe, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import styles from '../../../styles/Contact.module.css';

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
          <div className={styles.card}>            <div className={styles.titleSection}>
              <div className={styles.iconWrapper}>
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className={styles.title}>Contact Us</h1>              <p className={styles.subtitle}>
                We&apos;d love to hear from you! Get in touch with any questions, feedback, or suggestions.
              </p>
            </div>

            <div className="space-y-6">
              {/* Email Contact */}
              <div className={styles.contactSection}>
                <div className={styles.sectionHeader}>
                  <Mail className="w-5 h-5 text-blue-400" />
                  <h3 className={styles.sectionTitle}>Email Support</h3>
                </div>
                <p className={styles.sectionDescription}>
                  For general inquiries, feature requests, or technical support:
                </p>
                <a href="mailto:hello@lo-fi.study" className={styles.emailButton}>
                  <Mail size={16} />
                  hello@lo-fi.study
                </a>
              </div>              {/* Feedback */}
              <div className={styles.contactSection}>
                <div className={styles.sectionHeader}>
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <h3 className={styles.sectionTitle}>Feedback & Suggestions</h3>
                </div>
                <p className={styles.sectionDescription}>
                  Help us improve Lo-Fi.Study by sharing your thoughts and ideas:
                </p>
                <a href="mailto:feedback@lo-fi.study" className={styles.socialButton}>
                  <MessageCircle size={16} />
                  feedback@lo-fi.study
                </a>
              </div>

              {/* Website */}
              <div className={styles.contactSection}>
                <div className={styles.sectionHeader}>
                  <Globe className="w-5 h-5 text-green-400" />
                  <h3 className={styles.sectionTitle}>Website</h3>
                </div>
                <p className={styles.sectionDescription}>
                  Visit our main website:
                </p>
                <a 
                  href="https://lo-fi.study" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.submitButton}
                >
                  <Globe size={16} />
                  lo-fi.study
                </a>
              </div>
            </div>

            {/* Response Time */}
         
          </div>
        </div>
      </div>
    </div>
  );
}
