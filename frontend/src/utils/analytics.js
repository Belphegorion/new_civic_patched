class Analytics {
  constructor() {
    this.events = [];
  }

  track(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };
    
    this.events.push(event);
    
    // Send to backend in production
    if (process.env.NODE_ENV === 'production') {
      this.sendEvent(event);
    } else {
      console.log('Analytics Event:', event);
    }
  }

  async sendEvent(event) {
    try {
      await fetch('/api/v1/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  pageView(page) {
    this.track('page_view', { page });
  }

  reportCreated(reportId) {
    this.track('report_created', { reportId });
  }

  userLogin(userId) {
    this.track('user_login', { userId });
  }
}

export const analytics = new Analytics();