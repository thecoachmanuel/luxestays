
import { AppSettings, Booking, Apartment } from '@/types';
import { getSettings } from './db';
import nodemailer from 'nodemailer';
import { formatPrice } from './utils';
import { format } from 'date-fns';

export async function sendBookingInvoiceEmail(booking: Booking, apartment: Apartment) {
  const settings = await getSettings();
  const emailSettings = settings.emailSettings;

  if (!emailSettings) {
    console.warn('Email settings not configured. Skipping invoice email.');
    return;
  }

  const subject = `Booking Confirmation & Invoice - ${booking.id}`;
  const to = booking.userId; // Assuming userId is email
  
  const startDate = format(new Date(booking.startDate), 'MMM dd, yyyy');
  const endDate = format(new Date(booking.endDate), 'MMM dd, yyyy');
  const createdDate = format(new Date(booking.createdAt || new Date()), 'MMM dd, yyyy');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #000;">
        <h1 style="margin: 0; color: #000;">INVOICE</h1>
        <p style="margin: 5px 0; color: #666;">Booking Reference: #${booking.paymentReference || booking.id}</p>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 30px;">
          <h2 style="color: #000; border-bottom: 1px solid #eee; padding-bottom: 10px;">Booking Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Guest Email:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Check-in:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Check-out:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Invoice Date:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${createdDate}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #000; border-bottom: 1px solid #eee; padding-bottom: 10px;">Apartment</h2>
          <div style="display: flex; gap: 15px; align-items: center; margin-top: 15px;">
             ${apartment.image ? `<img src="${apartment.image}" alt="${apartment.title}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;" />` : ''}
             <div>
                <h3 style="margin: 0; font-size: 16px;">${apartment.title}</h3>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">${apartment.location}</p>
             </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #000; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0;">Apartment Rate</td>
              <td style="padding: 10px 0; text-align: right;">${formatPrice(apartment.price)} / night</td>
            </tr>
             ${booking.discountAmount ? `
            <tr style="border-bottom: 1px solid #eee; color: green;">
              <td style="padding: 10px 0;">Discount Applied</td>
              <td style="padding: 10px 0; text-align: right;">-${formatPrice(booking.discountAmount)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 15px 0; font-size: 18px; font-weight: bold;">Total Paid</td>
              <td style="padding: 15px 0; text-align: right; font-size: 18px; font-weight: bold; color: #000;">${formatPrice(booking.totalPrice)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; font-size: 14px; color: #666;">
          <p>Thank you for choosing us! We look forward to hosting you.</p>
          <p>If you have any questions, please contact our support.</p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #aaa;">
        &copy; ${new Date().getFullYear()} ${settings.appName || 'LuxeStays'}. All rights reserved.
      </div>
    </div>
  `;

  await sendEmail(to, subject, html);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const settings = await getSettings();
  const { siteName, logo, footer, footerSettings, seoSettings, address, colorPalette, welcomeEmail } = settings;
  const appName = siteName || settings.appName || "LuxeStays";
  const primaryColor = colorPalette?.brand || '#000000';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const currentFooter = footerSettings || footer;

  const subject = welcomeEmail?.subject || `Welcome to ${appName}! 🏡`;
  
  // Construct Social Links HTML
  let socialLinksHtml = '';
  if (currentFooter?.socialLinks) {
      const links = [];
      if (currentFooter.socialLinks.facebook) links.push(`<a href="${currentFooter.socialLinks.facebook}" style="margin: 0 10px; color: #666; text-decoration: none;">Facebook</a>`);
      if (currentFooter.socialLinks.twitter) links.push(`<a href="${currentFooter.socialLinks.twitter}" style="margin: 0 10px; color: #666; text-decoration: none;">Twitter</a>`);
      if (currentFooter.socialLinks.instagram) links.push(`<a href="${currentFooter.socialLinks.instagram}" style="margin: 0 10px; color: #666; text-decoration: none;">Instagram</a>`);
      if (links.length > 0) {
          socialLinksHtml = `<div style="margin-top: 20px;">${links.join(' | ')}</div>`;
      }
  }

  // Prepare dynamic values
  const logoOrTitle = logo 
    ? `<img src="${logo}" alt="${appName}" style="max-height: 60px; width: auto;" />` 
    : `<h1 style="margin: 0; color: ${primaryColor}; font-size: 24px;">${appName}</h1>`;
  
  const heroImage = seoSettings?.ogImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop";
  const year = new Date().getFullYear();
  const addressText = address || '123 Luxury Lane';

  // Get template from settings or use default
  let html = welcomeEmail?.body || '';
  
  // If body is empty or doesn't look like HTML, fallback to default structure
  if (!html || html.length < 50) {
     html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to {{appName}}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Header / Logo -->
        <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #eeeeee;">
            {{logoOrTitle}}
        </div>

        <!-- Hero Image -->
        <div style="width: 100%; height: 200px; background-image: url('{{heroImage}}'); background-size: cover; background-position: center;">
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="margin-top: 0; color: {{primaryColor}}; font-size: 24px; text-align: center;">Welcome Home, {{name}}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
            We are thrilled to have you join the <strong>{{appName}}</strong> community. You've just taken the first step towards experiencing luxury living at its finest.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 30px;">
            Whether you're looking for a cozy weekend getaway or a long-term premium residence, we have curated the perfect spaces just for you. Our apartments offer the perfect blend of comfort, style, and convenience.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="{{siteUrl}}/apartments" style="background-color: {{primaryColor}}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Browse Apartments</a>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #888; text-align: center;">
            Need help? Our support team is always here for you. Just reply to this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eeeeee;">
          <p style="margin: 0 0 10px 0;">&copy; {{year}} {{appName}}. All rights reserved.</p>
          <p style="margin: 0 0 10px 0;">{{address}}</p>
          {{socialLinks}}
          <div style="margin-top: 20px;">
             <a href="{{siteUrl}}/privacy" style="color: #888; text-decoration: underline; margin: 0 5px;">Privacy Policy</a>
             <a href="{{siteUrl}}/terms" style="color: #888; text-decoration: underline; margin: 0 5px;">Terms of Service</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  }

  // Perform Replacements
  html = html
    .replace(/{{appName}}/g, appName)
    .replace(/{{name}}/g, name)
    .replace(/{{logoOrTitle}}/g, logoOrTitle)
    .replace(/{{primaryColor}}/g, primaryColor)
    .replace(/{{heroImage}}/g, heroImage)
    .replace(/{{siteUrl}}/g, siteUrl)
    .replace(/{{year}}/g, year.toString())
    .replace(/{{address}}/g, addressText)
    .replace(/{{socialLinks}}/g, socialLinksHtml);

  await sendEmail(email, subject, html);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const settings = await getSettings();
  const emailSettings = settings.emailSettings;

  if (!emailSettings) {
    console.warn('Email settings not configured. Skipping email to:', to);
    return;
  }

  const from = `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`;

  console.log(`[Email Service] Sending email to ${to}`);
  console.log(`[Email Service] Subject: ${subject}`);
  console.log(`[Email Service] Provider: ${emailSettings.provider}`);

  if (emailSettings.provider === 'mock') {
    console.log('[Email Service] Content:', html);
    return;
  }

  if (emailSettings.provider === 'smtp') {
     try {
        // Auto-detect secure if not explicitly set
        // Port 465 is usually secure (SMTPS), 587/25 use STARTTLS (secure: false)
        let isSecure = emailSettings.secure;
        
        // Fix common misconfiguration for Port 465 (SMTPS)
        if (emailSettings.port === 465 && isSecure === false) {
            console.log('[Email Service] Port 465 detected but secure is false. Enabling secure automatically for SMTPS.');
            isSecure = true;
        }
        // Default to false if undefined
        if (isSecure === undefined) {
             isSecure = emailSettings.port === 465;
        }

        const transporter = nodemailer.createTransport({
            host: emailSettings.host,
            port: emailSettings.port,
            secure: isSecure, 
            auth: {
                user: emailSettings.user,
                pass: emailSettings.password,
            },
        });

        await transporter.verify(); // Verify connection configuration
        console.log('[Email Service] SMTP Connection verified');

        await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });
        console.log('Email sent successfully via SMTP');
     } catch (error) {
        console.error('SMTP Email Error:', error);
        throw error;
     }
  }

  // Example for Resend/Other APIs
  if (emailSettings.provider === 'resend' && emailSettings.apiKey) {
      try {
          const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${emailSettings.apiKey}`
              },
              body: JSON.stringify({
                  from,
                  to,
                  subject,
                  html
              })
          });
          
          if (!res.ok) {
              const err = await res.json();
              console.error('Resend API Error:', err);
              throw new Error('Failed to send email via Resend');
          }
      } catch (error) {
          console.error('Email send failed:', error);
          throw error;
      }
  }
}
