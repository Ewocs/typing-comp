// Network status and error handling utilities

class NetworkManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionStatus = 'connecting'; // 'connecting', 'connected', 'disconnected', 'reconnecting'
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.statusCallbacks = [];
    this.errorCallbacks = [];

    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });

    // Check initial status
    this.updateConnectionStatus();
  }

  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
  }

  onError(callback) {
    this.errorCallbacks.push(callback);
  }

  handleOnline() {
    console.log('Network: Online detected');
    this.showNotification('🔗 Back online!', 'success');
    this.updateConnectionStatus();
  }

  handleOffline() {
    console.log('Network: Offline detected');
    this.connectionStatus = 'disconnected';
    this.showNotification('📶 You are offline. Some features may not work.', 'warning');
    this.notifyStatusChange();
  }

  updateConnectionStatus() {
    if (!this.isOnline) {
      this.connectionStatus = 'disconnected';
      return;
    }

    // Could add more sophisticated connection checking here
    // For now, just assume connected if online
    this.connectionStatus = 'connected';
    this.retryAttempts = 0;
    this.notifyStatusChange();
  }

  notifyStatusChange() {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.connectionStatus, this.isOnline);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  notifyError(error, context) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `network-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getIconForType(type)}</span>
        <span class="notification-text">${message}</span>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getBackgroundForType(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 300px;
      font-size: 14px;
      animation: slideIn 0.3s ease;
      cursor: pointer;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);

    // Click to dismiss
    notification.addEventListener('click', () => notification.remove());
  }

  getIconForType(type) {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  }

  getBackgroundForType(type) {
    switch (type) {
      case 'success': return '#52c41a';
      case 'warning': return '#faad14';
      case 'error': return '#ff4d4f';
      default: return '#1890ff';
    }
  }

  async retryOperation(operation, context = '') {
    if (this.retryAttempts >= this.maxRetries) {
      this.showNotification(`❌ Failed to ${context} after ${this.maxRetries} attempts.`, 'error');
      return false;
    }

    if (!this.isOnline) {
      this.showNotification('📶 Cannot retry while offline. Please check your connection.', 'warning');
      return false;
    }

    this.retryAttempts++;
    this.showNotification(`🔄 Retrying ${context} (attempt ${this.retryAttempts}/${this.maxRetries})...`, 'info');

    try {
      const result = await operation();
      this.retryAttempts = 0;
      this.showNotification(`✅ ${context} successful!`, 'success');
      return result;
    } catch (error) {
      console.error(`Retry attempt ${this.retryAttempts} failed:`, error);

      if (this.retryAttempts >= this.maxRetries) {
        this.notifyError(error, context);
        this.showNotification(`❌ Failed to ${context} after ${this.maxRetries} attempts.`, 'error');
        return false;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, this.retryAttempts - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryOperation(operation, context);
    }
  }

  handleWebSocketError(error, socket) {
    console.error('WebSocket error:', error);

    if (!this.isOnline) {
      this.showNotification('📶 WebSocket disconnected due to network issues.', 'warning');
    } else {
      this.showNotification('🔌 Connection lost. Attempting to reconnect...', 'warning');
    }

    this.connectionStatus = 'reconnecting';
    this.notifyStatusChange();

    // Socket.IO handles reconnection automatically, but we can show status
    socket.on('reconnect', () => {
      this.connectionStatus = 'connected';
      this.showNotification('🔗 Reconnected successfully!', 'success');
      this.notifyStatusChange();
    });

    socket.on('reconnect_error', () => {
      this.connectionStatus = 'disconnected';
      this.showNotification('❌ Failed to reconnect. Please refresh the page.', 'error');
      this.notifyStatusChange();
    });
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }

  .network-notification {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .notification-icon {
    font-size: 16px;
  }

  .notification-text {
    flex: 1;
  }
`;
document.head.appendChild(style);

// Export for use in other scripts
window.NetworkManager = NetworkManager;