import "./App.css";
import { Mic, ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [userText, setUserText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
const [voiceStyle, setVoiceStyle] = useState("female");

  const generateTitle = (text) => {
    const lower = text.toLowerCase();

    if (lower.includes("weekday")) return "Order of weekdays";
    if (lower.includes("dinner")) return "Dinner conversation";
    if (lower.includes("python")) return "Python discussion";
    if (lower.includes("weather")) return "Weather information";
    if (lower.includes("ai")) return "AI discussion";

    return text.split(" ").slice(0, 4).join(" ");
  };
useEffect(() => {
  const loadVoices = () => {
    setVoices(window.speechSynthesis.getVoices());
  };

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}, []);
  const speakText = (text) => {
  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";

  if (voiceStyle === "fast") {
    speech.rate = 1.35;
  } else if (voiceStyle === "calm") {
    speech.rate = 0.82;
  } else {
    speech.rate = 1;
  }

  const selectedVoice =
    voiceStyle === "male"
      ? voices.find((v) => v.name.toLowerCase().includes("david")) || voices[0]
      : voices.find((v) => v.name.toLowerCase().includes("zira")) || voices[1];

  if (selectedVoice) {
    speech.voice = selectedVoice;
  }

  window.speechSynthesis.speak(speech);
};
useEffect(() => {
  if (token) {
    fetchHistory(token);
  }
}, []);
const fetchHistory = async (savedToken) => {
  if (!savedToken) return;

  try {
    const res = await fetch("http://127.0.0.1:8000/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: savedToken,
      }),
    });

    const data = await res.json();

    if (data.history) {
      setChatHistory(data.history);
    }
  } catch (error) {
    console.log(error);
  }
};
  const handleAuth = async () => {
    const url = isLogin
      ? "http://127.0.0.1:8000/login"
      : "http://127.0.0.1:8000/register";

    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Something went wrong");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        fetchHistory(data.token);
        setShowAuth(false);
        alert("Login successful");
      } else {
        alert("Registration successful. Please login.");
        setIsLogin(true);
      }
    } catch (error) {
      console.log(error);
      alert("Server connection failed.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setChatHistory([]);
    alert("Logged out");
  };

  const startNewConversation = () => {
    setChatHistory([]);
    setUserText("");
    window.speechSynthesis.cancel();
  };

  const sendToAI = async (message) => {
    if (!token) {
      setShowAuth(true);
      return;
    }

    try {
      setLoading(true);
      setUserText(message);

      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          token: token,
          history: chatHistory,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setChatHistory((prev) => [
          ...prev,
          {
            user: message,
            ai: data.reply,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);

        speakText(data.reply);
      } else {
        alert(data.detail || "Backend error occurred.");
      }
    } catch (error) {
      console.log(error);
      alert("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };
const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};


  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Use Google Chrome for voice recognition.");
      return;
    }

    window.speechSynthesis.cancel();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setListening(false);
      sendToAI(text);
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (event.error !== "aborted") {
        alert("Voice error: " + event.error);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <div className="app">
      {showSidebar && (
        <div className="sidebar">
          <button className="new-chat-btn" onClick={startNewConversation}>
            + New Conversation
          </button>

          <h2>Recent Chats</h2>

          {chatHistory.length === 0 ? (
            <p className="empty-history">No conversations yet</p>
          ) : (
            <div className="history-card">
              <p>{generateTitle(chatHistory[0].user)}</p>
            </div>
          )}
        </div>
      )}

      <nav className="navbar">
        <div className="logo">VaaniAI</div>

        <div className="nav-buttons">
          <button
            className="login-btn"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            Recent Chats
          </button>

          {token ? (
            <button className="login-btn" onClick={logout}>
              Logout
            </button>
          ) : (
            <button className="login-btn" onClick={() => setShowAuth(true)}>
              Login
            </button>
          )}

          <button
            className="start-btn"
            onClick={() => (token ? startListening() : setShowAuth(true))}
          >
            Start for Free
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="glow glow1"></div>
        <div className="glow glow2"></div>

        <h1>
          Global Voice AI for
          <br />
          Easy Work
        </h1>

        <h2>AI that understands you</h2>

        <p>
          Speak naturally, get instant AI replies, and automate your daily tasks
          with intelligent voice agents.
        </p>

        <div className="hero-buttons">
          <button className="primary-btn" onClick={startListening}>
            <Mic size={18} />
            {listening ? "Listening..." : "Start Voice Chat"}
          </button>

          <button
            className="secondary-btn"
            onClick={() => sendToAI(userText || "Hello")}
          >
            Send Text <ArrowRight size={18} />
          </button>
        </div>

        <div className="chat-window">
          <div className="chat-header">
            <div className={`avatar ${listening ? "mic-glow" : ""}`}>VA</div>
            <div>
              <h3>VaaniAI Assistant</h3>
              <span>
                {listening ? "Listening..." : loading ? "Thinking..." : "Online"}
              </span>
              <div className={`wave-bars ${listening ? "active" : ""}`}>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>
            </div>
          </div>

          <div className="messages-area">
            {chatHistory.length === 0 ? (
              <div className="empty-chat">
                <h3>Start a conversation</h3>
                <p>Tap the mic and speak naturally.</p>
              </div>
            ) : (
              chatHistory.map((chat, index) => (
                <div key={index}>
                  <div className="message-row user-row">
                    <div className="message-bubble user-bubble">
                      <p>{chat.user}</p>
                      <span>{chat.time}</span>
                    </div>
                  </div>

                  <div className="message-row ai-row">
                    <div className="message-bubble ai-bubble">
                      <p>{chat.ai}</p>
                      <span>{chat.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="message-row ai-row">
                <div className="message-bubble ai-bubble typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-controls">
            <button className="primary-btn" onClick={startListening}>
              <Mic size={18} />
              {listening ? "Listening..." : "Speak"}
            </button>

            <button className="secondary-btn" onClick={() => sendToAI("Hello")}>
              Send Hello <ArrowRight size={18} />
            </button>
            <button className="secondary-btn" onClick={stopSpeaking}>
  Stop Speaking
</button>
<select
  className="voice-select"
  value={voiceStyle}
  onChange={(e) => setVoiceStyle(e.target.value)}
>
  <option value="female">Female Voice</option>
  <option value="male">Male Voice</option>
  <option value="fast">Fast Voice</option>
  <option value="calm">Calm Voice</option>
</select>
          </div>
        </div>
      </section>

      {showAuth && (
        <div className="auth-overlay">
          <div className="auth-box">
            <button className="close-btn" onClick={() => setShowAuth(false)}>
              <X size={20} />
            </button>

            <h2>{isLogin ? "Login to VaaniAI" : "Create Account"}</h2>

            <p>
              {isLogin
                ? "Continue your voice chat journey"
                : "Start using VaaniAI for free"}
            </p>

            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="auth-submit" onClick={handleAuth}>
              {isLogin ? "Login" : "Register"}
            </button>

            <span className="switch-auth" onClick={() => setIsLogin(!isLogin)}>
              {isLogin
                ? "New user? Create an account"
                : "Already have an account? Login"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;