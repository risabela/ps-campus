var msgCount = 0;

function SendMsgToServer(msg) {
    $.ajax({
        type: "POST",
        url: "/log",
        data: msg,
        contentType: "text/plain"
    });
}

function OverwriteConsoleFunctions() {
    var sessionID = Math.floor(Math.random() * 1000);

    // Save old functions
    var oldLog = console.log;
    SendMsgToServer("old log:   " + oldLog);
    var oldWarn = console.warn;
    SendMsgToServer("old warn:  " + oldWarn);
    var oldError = console.error;
    SendMsgToServer("old error: " + oldError);

    // Replace functions
    console.log = function(msg) {
        SendMsgToServer("log   (" + sessionID + "): [" + msgCount + "] " + msg);
        oldLog.call(this, msg); // TODO WARNING untested!!!!
        msgCount += 1;
    };
    console.warn = function(msg) {
        SendMsgToServer("warn  (" + sessionID + "): [" + msgCount + "] " + msg);
        oldWarn.call(this, msg); // TODO WARNING untested!!!!
        msgCount += 1;
    };
    console.error = function(msg) {
        SendMsgToServer("error (" + sessionID + "): [" + msgCount + "] " + msg);
        oldError.call(this, msg); // TODO WARNING untested!!!!
        msgCount += 1;
    };

    // Catch detailed errors, send to server
    window.onerror = function(errorMsg, source, line) {
        console.error(errorMsg);
        console.error("    source: " + source);
        console.error("    line:   " + line);
    }

    console.log("new visitor - " + navigator.userAgent);
    console.log("console functions overwritten");
}

OverwriteConsoleFunctions();