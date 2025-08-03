const modernStyles = `    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            --dark-gradient: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            --glow-purple: #8b5cf6;
            --glow-blue: #06b6d4;
            --glow-pink: #ec4899;
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-accent: #fbbf24;
        }

        html { 
            background: var(--dark-gradient);
            scroll-behavior: smooth;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-primary);
            background: var(--dark-gradient);
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }
        
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-jetbrains { font-family: 'JetBrains Mono', monospace; }
        
        .glass {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border-radius: 1.5rem;
            box-shadow: var(--card-shadow);
            border: 1px solid var(--glass-border);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass:hover {
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .sidebar-glass { 
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--glass-border);
        }
        
        .premium-gradient {
            background: var(--primary-gradient);
        }
        
        .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }`;
