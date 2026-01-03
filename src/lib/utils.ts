import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Nice "ding" sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    
    // Cleanup
    setTimeout(() => {
        ctx.close();
    }, 600);
  } catch (e) {
    console.error("Audio error", e);
  }
}

export function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/globe.svg' });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body, icon: '/globe.svg' });
      }
    });
  }
}

export function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  // Handle: https://www.youtube.com/watch?v=VIDEO_ID
  // Handle: https://youtu.be/VIDEO_ID
  // Handle: https://www.youtube.com/embed/VIDEO_ID
  const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^#&?]*).*/;
  const match = url.match(youtubeRegex);
  
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  // Vimeo
  // Handle: https://vimeo.com/VIDEO_ID
  const vimeoRegex = /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
}
