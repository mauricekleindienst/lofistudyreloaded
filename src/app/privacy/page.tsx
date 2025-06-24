import React from 'react';
import { Shield, ArrowLeft, Eye, Lock, Database, UserCheck, Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import styles from '../../../styles/Privacy.module.css';

export default function PrivacyPolicyPage() {
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
          <div className={styles.card}>            <div className={styles.titleSection}>              <div className={styles.iconWrapper}>
                <Shield className={`${styles.iconLarge} ${styles.iconWhite}`} />
              </div>
              <h1 className={styles.title}>Privacy Policy</h1>
              <p className={styles.subtitle}>
                How we collect, use, and protect your information at Lo-Fi.Study
              </p>
            </div>

            <div className={styles.content}>
              {/* Overview */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Eye className={`${styles.iconMedium} ${styles.iconBlue}`} />
                  <h2 className={styles.sectionTitle}>Privacy Overview</h2>
                </div>
                <div className={styles.sectionCard}>
                  <p>
                    At Lo-Fi.Study, we are committed to protecting your privacy and ensuring the security of your personal information. 
                    This Privacy Policy explains how we collect, use, store, and protect your data when you use our productivity platform.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section className={styles.section}>                <div className={styles.sectionHeader}>
                  <Database className={`${styles.iconMedium} ${styles.iconPurple}`} />
                  <h2 className={styles.sectionTitle}>Information We Collect</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>
                      <UserCheck className={styles.iconSmall} />
                      Account Information
                    </h3>
                    <ul className={styles.dataList}>
                      <li className={styles.dataItem}>Email address (when you create an account)</li>
                      <li className={styles.dataItem}>Profile information from OAuth providers (Discord, GitHub, Google)</li>
                      <li className={styles.dataItem}>Authentication tokens for secure login</li>
                    </ul>
                  </div>
                  
                  <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>
                      <Settings className={styles.iconSmall} />
                      Usage Data
                    </h3>
                    <ul className={styles.dataList}>
                      <li className={styles.dataItem}>Pomodoro timer sessions and statistics</li>
                      <li className={styles.dataItem}>To-do list items and task completion data</li>
                      <li className={styles.dataItem}>Study session duration and frequency</li>
                      <li className={styles.dataItem}>App settings and preferences</li>
                    </ul>
                  </div>
                  
                  <div className={styles.subsection}>                    <h3 className={styles.subsectionTitle}>
                      <Database className={styles.iconSmall} />
                      Technical Information
                    </h3>
                    <ul className={styles.dataList}>
                      <li className={styles.dataItem}>Device type and browser information</li>
                      <li className={styles.dataItem}>IP address and general location</li>
                      <li className={styles.dataItem}>Usage patterns and app performance data</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Information */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Settings className={`${styles.iconMedium} ${styles.iconAmber}`} />
                  <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>
                      <Shield className={styles.iconSmall} />
                      Service Provision
                    </h3>
                    <ul className={styles.dataList}>
                      <li className={styles.dataItem}>Synchronize your data across devices</li>
                      <li className={styles.dataItem}>Save your progress and statistics</li>
                      <li className={styles.dataItem}>Provide personalized study insights</li>
                      <li className={styles.dataItem}>Maintain your account and preferences</li>
                    </ul>
                  </div>
                  
                  <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>
                      <Eye className={styles.iconSmall} />
                      Service Improvement
                    </h3>
                    <ul className={styles.dataList}>
                      <li className={styles.dataItem}>Analyze usage patterns to improve features</li>
                      <li className={styles.dataItem}>Fix bugs and optimize performance</li>
                      <li className={styles.dataItem}>Develop new functionality based on user needs</li>
                    </ul>
                  </div>                </div>
              </section>

              {/* Data Protection */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Lock className={`${styles.iconMedium} ${styles.iconGreen}`} />
                  <h2 className={styles.sectionTitle}>Data Protection & Security</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.subsection}>
                    <h3 className={styles.subsectionTitle}>
                      <Lock className={styles.iconSmall} />
                      Security Measures
                    </h3>
                    <ul className={styles.dataList}>
                      <li className={styles.dataItem}>All data is encrypted in transit and at rest</li>
                      <li className={styles.dataItem}>Secure authentication through trusted OAuth providers</li>
                      <li className={styles.dataItem}>Regular security audits and updates</li>
                      <li className={styles.dataItem}>Limited access to personal data on a need-to-know basis</li>
                    </ul>
                  </div>
                  
                  <div className={styles.subsection}>                    <h3 className={styles.subsectionTitle}>
                      <Database className={styles.iconSmall} />
                      Data Storage
                    </h3>
                    <p>
                      Your data is stored securely using Supabase, a trusted database provider with enterprise-grade security. 
                      We retain your data only as long as necessary to provide our services or as required by law.
                    </p>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <UserCheck className={`${styles.iconMedium} ${styles.iconCyan}`} />
                  <h2 className={styles.sectionTitle}>Your Rights</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.prose}>
                    <p>You have the following rights regarding your personal data:</p>
                    <ul>
                      <li><strong>Access:</strong> Request a copy of your personal data</li>
                      <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                      <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                      <li><strong>Portability:</strong> Request your data in a portable format</li>
                      <li><strong>Objection:</strong> Object to certain data processing activities</li>
                    </ul>
                    <p>
                      To exercise these rights, please contact us at{' '}
                      <a href="mailto:privacy@lo-fi.study" className={styles.link}>
                        privacy@lo-fi.study
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              {/* Third Party Services */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <AlertTriangle className={`${styles.iconMedium} ${styles.iconOrange}`} />
                  <h2 className={styles.sectionTitle}>Third-Party Services</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.warning}>
                    <div className={styles.warningTitle}>
                      <AlertTriangle className={styles.iconSmall} />
                      Third-Party Data Sharing
                    </div>
                    <div className={styles.warningText}>
                      We use the following third-party services and only share data necessary for providing our services.
                    </div>
                  </div>
                  <div className={styles.prose}>
                    <p>We use the following third-party services:</p>
                    <ul>
                      <li><strong>Supabase:</strong> Database and authentication services</li>
                      <li><strong>Vercel:</strong> Website hosting and deployment</li>
                      <li><strong>OAuth Providers:</strong> Discord, GitHub, and Google for authentication</li>
                    </ul>
                    <p>
                      These services have their own privacy policies, and we encourage you to review them.
                    </p>
                  </div>
                </div>
              </section>

              {/* Cookies and Local Storage */}
              <section className={styles.section}>
                <div className={styles.highlight}>
                  <div className={styles.highlightTitle}>
                    <Shield className={styles.iconSmall} />
                    Cookies and Local Storage
                  </div>
                  <div className={styles.highlightText}>
                    We use browser local storage to save your preferences and session data when you&apos;re not logged in. 
                    For logged-in users, data is synchronized with our secure servers. We do not use tracking cookies 
                    or share data with advertising networks.
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <div className={styles.contact}>
                  <h3 className={styles.contactTitle}>Privacy Questions?</h3>
                  <p className={styles.contactText}>
                    If you have any questions about this privacy policy or how we handle your data, please contact us:
                  </p>                  <a href="mailto:privacy@lo-fi.study" className={styles.contactLink}>
                    <Shield className={styles.iconSmall} />
                    privacy@lo-fi.study
                  </a>
                </div>
              </section>
            </div>

            <div className={styles.lastUpdated}>
              <p className={styles.lastUpdatedText}>
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
