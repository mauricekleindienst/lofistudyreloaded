import React from 'react';
import { FileText, ArrowLeft, Building, User, Globe } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import styles from '../../../styles/PageLayout.module.css';

export const metadata: Metadata = {
  title: 'Legal Notice',
  description: 'Legal information, terms of service, and regulatory compliance details for Lo-Fi.Study productivity app.',
  keywords: ['legal notice', 'terms of service', 'compliance', 'lo-fi study', 'legal information'],
  openGraph: {
    title: 'Legal Notice | Lo-Fi.Study',
    description: 'Legal information, terms of service, and regulatory compliance details for Lo-Fi.Study productivity app.',
    url: '/legal',
  },
  twitter: {
    title: 'Legal Notice | Lo-Fi.Study',
    description: 'Legal information, terms of service, and regulatory compliance details for Lo-Fi.Study.',
  },
};

export default function LegalNoticePage() {
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
                <FileText className={styles.iconLarge} />
              </div>
              <h1 className={styles.title}>Legal Notice</h1>
              <p className={styles.subtitle}>
                Legal information and terms for Lo-Fi.Study
              </p>
            </div>

            <div className={styles.content}>
              {/* Service Provider */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Building className={`${styles.iconMedium} ${styles.iconAmber}`} />
                  <h2 className={styles.sectionTitle}>Service Provider Information</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.prose}>
                    <p><strong>Service:</strong> Lo-Fi.Study</p>
                    <p><strong>Website:</strong> <a href="https://lo-fi.study">https://lo-fi.study</a></p>
                    <p><strong>Email:</strong> <a href="mailto:hello@lo-fi.study">hello@lo-fi.study</a></p>
                  </div>
                </div>
              </section>
              
              {/* Disclaimer */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <User className={`${styles.iconMedium} ${styles.iconPurple}`} />
                  <h2 className={styles.sectionTitle}>Disclaimer</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.prose}>
                    <h3>Content Responsibility</h3>
                    <p>
                      The contents of our pages have been created with the utmost care. However, we cannot guarantee 
                      the contents&apos; accuracy, completeness, or topicality. According to statutory provisions, we are 
                      furthermore responsible for our own content on these web pages.
                    </p>
                    
                    <h3>External Links</h3>
                    <p>
                      Our website contains links to external third-party websites. We have no influence on the contents 
                      of those websites, therefore we cannot guarantee for those contents. Providers or administrators 
                      of linked websites are always responsible for their own contents.
                    </p>
                    
                    <h3>Copyright</h3>
                    <p>
                      The content and works on these pages created by the site operators are subject to copyright law. 
                      Duplication, processing, distribution, or any form of commercialization of such material beyond 
                      the scope of the copyright law shall require the prior written consent of its respective author or creator.
                    </p>
                  </div>
                </div>
              </section>
              
              {/* Service Terms */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Globe className={`${styles.iconMedium} ${styles.iconGreen}`} />
                  <h2 className={styles.sectionTitle}>Service Terms</h2>
                </div>
                <div className={styles.sectionCard}>
                  <div className={styles.prose}>
                    <h3>Service Availability</h3>
                    <p>
                      Lo-Fi.Study is provided &quot;as is&quot; without warranties of any kind. While we strive to maintain 
                      high availability, we do not guarantee uninterrupted service.
                    </p>
                    
                    <h3>User Accounts</h3>
                    <p>
                      User accounts are provided for convenience and data synchronization. Users are responsible 
                      for maintaining the security of their account credentials.
                    </p>
                    
                    <h3>Data Usage</h3>
                    <p>
                      Users retain ownership of their data. We use data solely to provide and improve our services. 
                      For detailed information about data handling, please refer to our Privacy Policy.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <div className={styles.contact}>
                <h3 className={styles.contactTitle}>Questions or Concerns?</h3>
                <p className={styles.contactText}>
                  If you have any questions about this legal notice or our services, please contact us:
                </p>
                <a href="mailto:hello@lo-fi.study" className={styles.contactLink}>
                  <User className={styles.iconSmall} />
                  hello@lo-fi.study
                </a>
              </div>
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
