# Setting Up PDF Folder Manager with launchd (macOS)

This guide shows you how to run PDF Folder Manager as a background service on macOS that starts automatically on boot.

## What is launchd?

launchd is macOS's built-in service management system. It can:
- Start services automatically when you log in or the system boots
- Restart services if they crash
- Run services in the background
- Manage service logs

---

## Quick Setup

### 1. Stop the current server (if running)

```bash
pkill -f "node server/server.js"
```

### 2. Copy the plist file to LaunchAgents

```bash
cp "/Users/Hubie1/Desktop/Claude Code/com.behilnortu.pdf-manager.plist" ~/Library/LaunchAgents/
```

### 3. Load the service

```bash
launchctl load ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
```

### 4. Start the service

```bash
launchctl start com.behilnortu.pdf-manager
```

### 5. Verify it's running

```bash
launchctl list | grep pdf-manager
```

You should see output like:
```
12345   0   com.behilnortu.pdf-manager
```

The service is now running and will:
- ✅ Start automatically when you log in
- ✅ Restart if it crashes
- ✅ Run in the background
- ✅ Be accessible at http://localhost:3000

---

## Managing Your Service

### Check if service is running
```bash
launchctl list | grep pdf-manager
```

### Stop the service
```bash
launchctl stop com.behilnortu.pdf-manager
```

### Start the service
```bash
launchctl start com.behilnortu.pdf-manager
```

### Restart the service
```bash
launchctl stop com.behilnortu.pdf-manager
launchctl start com.behilnortu.pdf-manager
```

### Unload the service (disable auto-start)
```bash
launchctl unload ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
```

### Reload the service (after editing plist)
```bash
launchctl unload ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
launchctl load ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
```

### Remove the service completely
```bash
launchctl unload ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
rm ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
```

---

## Viewing Logs

Your service logs are saved to:

**Standard output (normal logs):**
```bash
tail -f ~/Library/Logs/pdf-manager.log
```

**Error logs:**
```bash
tail -f ~/Library/Logs/pdf-manager-error.log
```

**View last 50 lines:**
```bash
tail -50 ~/Library/Logs/pdf-manager.log
```

---

## Troubleshooting

### Service won't start

1. **Check the logs:**
   ```bash
   cat ~/Library/Logs/pdf-manager-error.log
   ```

2. **Verify the plist syntax:**
   ```bash
   plutil -lint ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
   ```

3. **Check if Node.js path is correct:**
   ```bash
   which node
   ```
   Update the plist if the path is different.

4. **Check permissions:**
   ```bash
   ls -la ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist
   ```
   Should be readable by your user.

### Service keeps crashing

Check the error log:
```bash
tail -f ~/Library/Logs/pdf-manager-error.log
```

Common issues:
- Wrong Node.js path
- Missing dependencies (run `npm install`)
- Port 3000 already in use
- File permissions issues

### Can't access http://localhost:3000

1. Check if service is running:
   ```bash
   launchctl list | grep pdf-manager
   lsof -ti:3000
   ```

2. Check the logs:
   ```bash
   tail -20 ~/Library/Logs/pdf-manager.log
   ```

---

## Understanding the Configuration

The plist file (`com.behilnortu.pdf-manager.plist`) contains:

- **Label**: Unique identifier for your service
- **ProgramArguments**: Command to run (node + server path)
- **WorkingDirectory**: Where the service runs from
- **RunAtLoad**: Start when loaded (at login)
- **KeepAlive**: Restart if it crashes
- **StandardOutPath**: Where to save normal logs
- **StandardErrorPath**: Where to save error logs
- **EnvironmentVariables**: PATH and NODE_ENV settings
- **ThrottleInterval**: Wait 10 seconds before restarting after crash

---

## When to Use launchd vs. Running Manually

### Use launchd when:
- ✅ You want the server to start automatically on boot/login
- ✅ You want it to run in the background all the time
- ✅ You want automatic restarts if it crashes
- ✅ You're running this on a personal/development Mac long-term

### Run manually when:
- ✅ You're just testing/developing
- ✅ You only need it occasionally
- ✅ You want to see output in the terminal
- ✅ You're troubleshooting issues

---

## Alternative: Run Only When Needed

If you don't want it running all the time, you can use `OnDemand` instead:

Edit the plist and replace:
```xml
<key>RunAtLoad</key>
<true/>
<key>KeepAlive</key>
<dict>
    <key>SuccessfulExit</key>
    <false/>
</dict>
```

With:
```xml
<key>RunAtLoad</key>
<false/>
<key>KeepAlive</key>
<false/>
<key>Sockets</key>
<dict>
    <key>Listener</key>
    <dict>
        <key>SockServiceName</key>
        <string>3000</string>
    </dict>
</dict>
```

This will start the service only when someone accesses port 3000.

---

## Complete Setup Script

Here's a one-command setup:

```bash
#!/bin/bash

# Stop current server
pkill -f "node server/server.js"

# Copy plist
cp "/Users/Hubie1/Desktop/Claude Code/com.behilnortu.pdf-manager.plist" ~/Library/LaunchAgents/

# Load and start
launchctl load ~/Library/LaunchAgents/com.behilnortu.pdf-manager.plist

# Verify
sleep 2
echo "Checking if service is running..."
launchctl list | grep pdf-manager

echo ""
echo "Service should now be running at http://localhost:3000"
echo "View logs: tail -f ~/Library/Logs/pdf-manager.log"
```

Save this as `setup-launchd.sh`, make it executable, and run it:
```bash
chmod +x setup-launchd.sh
./setup-launchd.sh
```

---

## Next Steps

After setting up launchd:

1. **Test it:** Go to http://localhost:3000
2. **Check logs:** `tail -f ~/Library/Logs/pdf-manager.log`
3. **Reboot:** Restart your Mac and verify it auto-starts
4. **Monitor:** Occasionally check logs for any issues

Your PDF Folder Manager is now a proper macOS service! 🚀
