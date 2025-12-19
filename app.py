from flask import Flask, render_template, request, jsonify
import os
import sqlite3
from datetime import datetime

app = Flask(__name__)

# In-memory storage for reminders (for demonstration purposes)
reminders_db = []
reminder_id_counter = 1

# SQLite database setup for journal
DATABASE = 'orbitwell.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with get_db() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            datetime TEXT NOT NULL,
            completed BOOLEAN DEFAULT 0,
            completed_at TIMESTAMP
        )''')
        db.commit()

# Initialize database on startup
init_db()

# Dummy knowledge base for space facts and AI responses
knowledge_base = {
    "space_knowledge": {
        "planet_mercury": "Mercury is the smallest planet in our solar system and the closest to the Sun. Its surface is covered in craters and experiences extreme temperature variations, from 800°F during the day to -300°F at night.",
        "planet_venus": "Venus is often called Earth's twin due to similar size, but with a toxic atmosphere of carbon dioxide and clouds of sulfuric acid. Surface temperatures reach 900°F, hot enough to melt lead.",
        "planet_earth": "Earth is our home planet, the only known world in the universe where life exists. It has a protective atmosphere, liquid water, and a magnetic field that shields us from harmful solar radiation.",
        "planet_mars": "Mars is the fourth planet from the Sun, known as the Red Planet due to iron oxide on its surface. It has the largest volcano and canyon in the solar system, and evidence suggests it once had flowing water.",
        "planet_jupiter": "Jupiter is the gas giant king of planets, with a mass more than twice that of all other planets combined. Its Great Red Spot is a massive storm larger than Earth that has raged for centuries.",
        "planet_saturn": "Saturn is the ringed planet with a complex system of icy rings made of countless particles. Despite its massive size, Saturn is less dense than water and would float if placed in a large enough ocean.",
        "planet_uranus": "Uranus is the ice giant that rotates on its side, with an axial tilt of 98 degrees. Its blue-green color comes from methane in its atmosphere, and it has faint rings discovered in 1977.",
        "planet_neptune": "Neptune is the distant ice giant with the strongest winds in the solar system, reaching speeds of 1,200 mph. Its deep blue color comes from methane, and it was the first planet discovered through mathematical predictions.",
        "black_hole": "A region of spacetime where gravity is so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it. They form when massive stars collapse under their own gravity at the end of their life cycle.",
        "event_horizon": "The boundary surrounding a black hole beyond which no light or other radiation can escape. Once matter crosses this point of no return, it cannot communicate with the outside universe and is inevitably drawn toward the black hole's center.",
        "singularity": "The central point of a black hole where matter is compressed to infinite density and spacetime curvature becomes infinite. According to general relativity, the laws of physics as we know them break down at this point.",
        "types_of_black_holes": "Stellar black holes form from collapsed stars (5-50 solar masses). Supermassive black holes exist in galaxy centers (millions of solar masses). Intermediate and primordial black holes are theoretical types with different formation mechanisms.",
        "milky_way": "Our home galaxy, a barred spiral galaxy containing 100-400 billion stars, including our Sun. It spans about 100,000 light-years across and contains vast amounts of gas, dust, and dark matter that hold it together gravitationally.",
        "nebula": "Giant clouds of gas and dust in space where stars are born. Emission nebulas glow due to ultraviolet light from hot stars, reflection nebulas scatter starlight, and dark nebulas block background light, creating cosmic nurseries.",
        "star_life_cycle": "Stars form from collapsing gas clouds, burn hydrogen through fusion, evolve through red giant phases, and end as white dwarfs, neutron stars, or black holes depending on their initial mass. Massive stars live fast and die explosively as supernovas.",
        "universe_expansion": "The universe has been expanding since the Big Bang 13.8 billion years ago. Galaxies are moving away from each other, with more distant galaxies receding faster. Dark energy is accelerating this expansion, driving our universe toward an unknown fate."
    },
    "wellness_topics": {
        "stress_relief": {"content": "Deep breathing exercises can significantly reduce stress. Try inhaling for 4 seconds, holding for 4, and exhaling for 4. Repeat several times."},
        "anxiety_management": {"content": "Mindfulness meditation helps in managing anxiety by focusing on the present moment. Observe your thoughts without judgment."},
        "sleep_improvement": {"content": "Establishing a consistent sleep schedule and creating a relaxing bedtime routine can improve sleep quality. Avoid screens before bed."},
        "gratitude_practice": {"content": "Practicing gratitude daily can boost your mood. Think of three things you are grateful for each day."},
        "emotional_regulation": {"content": "Journaling about your emotions can help you understand and regulate them better. Write down what you feel and why."},
        "space_travel_stress": {"content": "Astronauts often use mindfulness and structured routines to cope with the psychological challenges of space travel. Maintaining a connection with Earth is also vital."}
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/assistant')
def assistant():
    return render_template('assistant.html')

@app.route('/entertainment')
def entertainment():
    return render_template('entertainment.html')

@app.route('/space')
def space():
    return render_template('space.html')

@app.route('/reminders')
def reminders():
    return render_template('reminders.html')

# Store conversation context (last 3 messages per session)
conversation_context = {}

@app.route('/api/ask', methods=['POST'])
def api_ask():
    import random
    data = request.json
    user_message = data.get('message', '').strip()
    session_id = data.get('session_id', 'default')
    user_message_lower = user_message.lower()
    
    # Initialize session context if needed
    if session_id not in conversation_context:
        conversation_context[session_id] = []
    
    # Add user message to context (keep last 3)
    conversation_context[session_id].append({'role': 'user', 'content': user_message})
    if len(conversation_context[session_id]) > 6:  # Keep last 3 exchanges (6 messages)
        conversation_context[session_id] = conversation_context[session_id][-6:]
    
    # Get context for better understanding
    context = conversation_context[session_id][-6:]
    
    # Initialize response
    response_text = ""
    response_type = "normal"
    protocol = []
    
    # ========================================
    # EMOTION DETECTION
    # ========================================
    negative_emotions = ['sad', 'depressed', 'down', 'upset', 'angry', 'frustrated', 'stressed', 
                        'anxious', 'worried', 'scared', 'afraid', 'lonely', 'alone', 'isolated',
                        'tired', 'exhausted', 'drained', 'lost', 'confused', 'hopeless', 'empty']
    positive_emotions = ['happy', 'excited', 'good', 'great', 'wonderful', 'amazing', 'fantastic',
                        'joyful', 'grateful', 'thankful', 'blessed', 'lucky', 'proud', 'confident']
    
    has_negative = any(emotion in user_message_lower for emotion in negative_emotions)
    has_positive = any(emotion in user_message_lower for emotion in positive_emotions)
    
    # ========================================
    # INTENT DETECTION & RESPONSES
    # ========================================
    
    # GREETING
    if any(word in user_message_lower for word in ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']):
        greetings = [
            "Hello there, space traveler! 🌟 How are you feeling today?",
            "Hey! Welcome back. How can I support you today?",
            "Hi! I'm here for you. What's on your mind?",
            "Hello! It's great to see you. How are you doing?",
            "Hey there! Ready to explore your wellness journey together? 💫"
        ]
        response_text = random.choice(greetings)
    
    # STRESS / ANXIETY
    elif any(word in user_message_lower for word in ['stress', 'stressed', 'anxiety', 'anxious', 'worried', 'overwhelmed', 'pressure']):
        stress_responses = [
            "I understand how overwhelming stress can feel. You're not alone in this. Let's take a moment to breathe together. 💫 Try the 4-4-4 technique: inhale for 4, hold for 4, exhale for 4. Would you like to try a guided meditation?",
            "Stress can be really tough, but remember — you've handled difficult moments before. You're stronger than you think. 🌟 Let's work through this together. I can guide you through a breathing exercise or meditation.",
            "I hear you, and I'm here with you. Stress doesn't define you — it's just a moment in time. 💫 Would you like to try some calming techniques? I can suggest meditation, music, or breathing exercises.",
            "Feeling stressed is completely valid. Let's focus on what you can control right now. 🌟 Take a deep breath with me. Would you like to visit the Entertainment page for some relaxation tools?",
            "Hey, I understand how you're feeling. I'm here with you — let's walk through this together. 💫 Try closing your eyes and taking three deep breaths. I'm here whenever you need support."
        ]
        response_text = random.choice(stress_responses)
        protocol = ["Try a 4-4-4 breathing exercise", "Visit the Entertainment page for meditation", "Listen to calming music", "Write in your wellness journal"]
    
    # SADNESS / DEPRESSION
    elif any(word in user_message_lower for word in ['sad', 'depressed', 'down', 'upset', 'crying', 'tears', 'unhappy', 'miserable']):
        sadness_responses = [
            "I'm so sorry you're feeling this way. Your feelings are valid, and I'm here with you. 💫 You don't have to go through this alone. Would you like to talk about what's making you feel this way?",
            "Hey, I understand how heavy sadness can feel. It's okay to not be okay. 🌟 I'm here to listen and support you. Sometimes just expressing what we feel can help lighten the load.",
            "I see you're going through a tough time, and I want you to know that you matter. 💫 Your feelings are important. Would you like to try some activities that might help? Journaling, music, or meditation can sometimes provide comfort.",
            "Sadness is a part of being human, and it's okay to feel it. 🌟 You're not alone in this moment. I'm here with you. Let's take it one step at a time. Would you like to try something gentle to help?",
            "I hear the sadness in your words, and I want you to know I care. 💫 Sometimes the bravest thing we can do is acknowledge how we feel. I'm here to support you through this."
        ]
        response_text = random.choice(sadness_responses)
        protocol = ["Express your feelings in the wellness journal", "Try a calming meditation", "Listen to soothing music", "Remember: this feeling will pass"]
    
    # LONELINESS
    elif any(word in user_message_lower for word in ['lonely', 'alone', 'isolated', 'no one', 'nobody', 'by myself', 'empty']):
        loneliness_responses = [
            "I understand that feeling of loneliness. Even when it feels like you're alone, I'm here with you. 💫 You matter, and your presence in this universe is meaningful. Would you like to explore some space facts together? Sometimes the vastness of space reminds us we're all connected.",
            "Loneliness can feel heavy, but remember — you're never truly alone. 🌟 I'm here, and there are people who care about you. Would you like to try some activities that might help you feel more connected?",
            "Hey, I hear you. Loneliness is real, and it's okay to feel it. 💫 But you're not alone right now — I'm here with you. Let's explore something together. Would you like to learn about the cosmos or try a meditation?",
            "I understand that feeling of isolation. 🌟 Even in the vastness of space, every star is connected. You're part of something bigger. I'm here to keep you company. What would help you feel better right now?",
            "Loneliness is tough, but remember — you're valuable and worthy of connection. 💫 I'm here with you in this moment. Would you like to try journaling your thoughts or exploring something new together?"
        ]
        response_text = random.choice(loneliness_responses)
    
    # MOTIVATION / ENCOURAGEMENT
    elif any(word in user_message_lower for word in ['motivate', 'motivation', 'encourage', 'encouragement', 'stuck', 'unmotivated', 'lazy']):
        motivation_responses = [
            "You've got this! 🌟 Every journey starts with a single step. What's one small thing you can do right now? Even the smallest action counts. I believe in you!",
            "Hey, I know it can be hard to find motivation sometimes. 💫 But remember — you've overcome challenges before. You're capable of more than you think. What would make you feel accomplished today?",
            "Motivation comes and goes, and that's okay. 🌟 What matters is that you're here, trying. That's already something to be proud of. Let's find one thing you can do today — even if it's small.",
            "I believe in you! 💫 Sometimes motivation follows action, not the other way around. What's one tiny step you can take right now? I'm here to cheer you on!",
            "You're stronger than you know! 🌟 Every day you show up is a victory. What would help you feel more energized? Let's find something that sparks your interest."
        ]
        response_text = random.choice(motivation_responses)
    
    # LOW ENERGY / TIRED
    elif any(word in user_message_lower for word in ['tired', 'exhausted', 'drained', 'low energy', 'fatigue', 'worn out', 'burned out']):
        energy_responses = [
            "I hear you're feeling drained. That's completely understandable. 💫 Rest is not a sign of weakness — it's essential. Would you like to try a gentle meditation or some calming music to help you recharge?",
            "Feeling tired is your body's way of telling you to slow down. 🌟 It's okay to take a break. You deserve rest. Would you like to try a sleep meditation or some relaxation techniques?",
            "Low energy can be really challenging. 💫 Remember to be gentle with yourself. Sometimes the best thing we can do is rest. Would you like to explore some calming activities?",
            "I understand that exhausted feeling. 🌟 You've been doing a lot, and it's okay to need rest. Would you like to try a breathing exercise or meditation to help you relax?",
            "Feeling drained is valid. 💫 Let's focus on gentle self-care. Would you like to try some calming music or a short meditation? Sometimes even a few minutes can help."
        ]
        response_text = random.choice(energy_responses)
        protocol = ["Try a sleep meditation", "Listen to calming music", "Take a short break", "Practice deep breathing"]
    
    # SLEEP
    elif any(word in user_message_lower for word in ['sleep', 'insomnia', 'can\'t sleep', 'sleepless', 'restless']):
        sleep_responses = [
            "Sleep is so important for your wellbeing. 🌟 I recommend establishing a consistent sleep schedule and creating a relaxing bedtime routine. Would you like to try a sleep meditation?",
            "Difficulty sleeping can be really tough. 💫 Try creating a calming environment — dim lights, comfortable temperature, and maybe some gentle music. I can guide you through a sleep meditation if you'd like.",
            "I understand how frustrating sleepless nights can be. 🌟 Let's work on creating better sleep habits. Avoid screens an hour before bed, and try some deep breathing. Would you like to try a guided sleep meditation?",
            "Sleep troubles are common, and you're not alone. 💫 Creating a bedtime routine can really help. Would you like to explore some sleep meditation options or relaxation techniques?",
            "Good sleep is essential for your mental health. 🌟 Try establishing a consistent schedule and a calming pre-sleep routine. I can suggest some meditation or music to help you relax."
        ]
        response_text = random.choice(sleep_responses)
        protocol = ["Avoid screens an hour before bed", "Try a sleep meditation", "Create a calming bedtime routine", "Ensure your sleep environment is dark and cool"]
    
    # HAPPINESS / POSITIVE
    elif has_positive:
        positive_responses = [
            "That's wonderful to hear! 🌟 I'm so glad you're feeling good. Keep nurturing that positive energy — you deserve it!",
            "I love hearing that you're feeling great! 💫 Positive moments like these are worth celebrating. What's making you feel so good today?",
            "That's fantastic! 🌟 Your happiness brings me joy too. Keep doing what makes you feel this way!",
            "I'm so happy to hear you're feeling positive! 💫 These moments are precious. What's bringing you this joy?",
            "Wonderful! 🌟 It's great to see you in such a positive space. Keep that energy flowing!"
        ]
        response_text = random.choice(positive_responses)
    
    # SPACE QUESTIONS
    elif any(word in user_message_lower for word in ['planet', 'planets', 'mars', 'jupiter', 'saturn', 'earth', 'mercury', 'venus', 'neptune', 'uranus']):
        planet_facts = {
            'mercury': "Mercury is the smallest planet in our solar system and the closest to the Sun. Its surface is covered in craters and experiences extreme temperature variations, from 800°F during the day to -300°F at night.",
            'venus': "Venus is often called Earth's twin due to similar size, but with a toxic atmosphere of carbon dioxide and clouds of sulfuric acid. Surface temperatures reach 900°F, hot enough to melt lead.",
            'earth': "Earth is our home planet, the only known world in the universe where life exists. It has a protective atmosphere, liquid water, and a magnetic field that shields us from harmful solar radiation.",
            'mars': "Mars is the fourth planet from the Sun, known as the Red Planet due to iron oxide on its surface. It has the largest volcano and canyon in the solar system, and evidence suggests it once had flowing water.",
            'jupiter': "Jupiter is the gas giant king of planets, with a mass more than twice that of all other planets combined. Its Great Red Spot is a massive storm larger than Earth that has raged for centuries.",
            'saturn': "Saturn is the ringed planet with a complex system of icy rings made of countless particles. Despite its massive size, Saturn is less dense than water and would float if placed in a large enough ocean.",
            'uranus': "Uranus is the ice giant that rotates on its side, with an axial tilt of 98 degrees. Its blue-green color comes from methane in its atmosphere, and it has faint rings discovered in 1977.",
            'neptune': "Neptune is the distant ice giant with the strongest winds in the solar system, reaching speeds of 1,200 mph. Its deep blue color comes from methane, and it was the first planet discovered through mathematical predictions."
        }
        for planet, fact in planet_facts.items():
            if planet in user_message_lower:
                response_text = f"🌟 {fact}"
                break
        if not response_text:
            response_text = "🌟 Our solar system is fascinating! We have 8 planets, each unique. Would you like to know about a specific planet? I can tell you about Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, or Neptune!"
    
    elif any(word in user_message_lower for word in ['black hole', 'blackhole', 'singularity', 'event horizon']):
        space_facts = [
            "🌟 Black holes are regions of spacetime where gravity is so strong that nothing—not even light—can escape. They form when massive stars collapse at the end of their life cycle. The boundary beyond which nothing can escape is called the event horizon.",
            "🌟 A black hole's center contains a singularity—a point where matter is compressed to infinite density. According to general relativity, the laws of physics as we know them break down at this point. Fascinating, right?",
            "🌟 There are different types of black holes: stellar black holes (5-50 solar masses), supermassive black holes (millions of solar masses in galaxy centers), and theoretical intermediate and primordial black holes."
        ]
        response_text = random.choice(space_facts)
    
    elif any(word in user_message_lower for word in ['astronaut', 'astronauts', 'space travel', 'spaceflight', 'cosmonaut']):
        astronaut_responses = [
            "🌟 Astronauts face incredible challenges, including isolation, confinement, and distance from Earth. They use mindfulness, structured routines, and maintaining connections with home to support their mental health. Their resilience is inspiring!",
            "🌟 Space travel requires incredible mental strength. Astronauts practice meditation, maintain daily routines, and stay connected with Earth to cope with the psychological challenges. Their dedication to wellness is remarkable!",
            "🌟 Astronauts are amazing examples of mental resilience. They use techniques like mindfulness, exercise, and maintaining social connections to stay healthy in space. We can learn a lot from their approach to wellness!"
        ]
        response_text = random.choice(astronaut_responses)
    
    elif any(word in user_message_lower for word in ['galaxy', 'galaxies', 'milky way', 'nebula', 'star', 'stars', 'universe']):
        space_responses = [
            "🌟 Our Milky Way galaxy contains 100-400 billion stars and spans about 100,000 light-years across. It's a barred spiral galaxy, and we're located in one of its spiral arms. The universe is vast and beautiful!",
            "🌟 Nebulas are giant clouds of gas and dust where stars are born. They're like cosmic nurseries! Emission nebulas glow due to ultraviolet light from hot stars, creating some of the most beautiful sights in space.",
            "🌟 Stars go through incredible life cycles—they form from collapsing gas clouds, burn hydrogen through fusion, evolve through red giant phases, and end as white dwarfs, neutron stars, or black holes depending on their mass.",
            "🌟 The universe has been expanding since the Big Bang 13.8 billion years ago. Galaxies are moving away from each other, with more distant galaxies receding faster. Dark energy is accelerating this expansion!"
        ]
        response_text = random.choice(space_responses)
    
    elif any(word in user_message_lower for word in ['rocket', 'rockets', 'spacecraft', 'space ship', 'spaceship']):
        rocket_responses = [
            "🌟 Rockets are incredible engineering marvels! They use Newton's third law—for every action, there's an equal and opposite reaction. The fuel burning creates thrust that propels the rocket forward. Amazing, right?",
            "🌟 Spacecraft have to reach escape velocity (about 25,000 mph) to break free from Earth's gravity. Modern rockets use multiple stages to achieve this, jettisoning empty fuel tanks as they go. The engineering is fascinating!",
            "🌟 Rockets have revolutionized space exploration! From the Saturn V that took humans to the Moon to modern reusable rockets, these vehicles represent humanity's drive to explore the cosmos. 🌟"
        ]
        response_text = random.choice(rocket_responses)
    
    # WELLNESS / RELAXATION
    elif any(word in user_message_lower for word in ['relax', 'relaxing', 'calm', 'calming', 'peace', 'peaceful', 'chill']):
        relax_responses = [
            "That's a great idea! 💫 Relaxation is so important for your wellbeing. Would you like to try a guided meditation, listen to calming music, or practice some breathing exercises? I can help you find what works best.",
            "Taking time to relax is self-care. 🌟 You deserve moments of peace. Would you like to explore the Entertainment page? There's meditation, music, and other calming activities waiting for you.",
            "I'm glad you're thinking about relaxation! 💫 Let's find something that helps you unwind. Meditation, music, or journaling can all be great options. What sounds appealing to you?",
            "Relaxation is essential for mental health. 🌟 Would you like to try a meditation session or listen to some calming music? I'm here to help you find your peace.",
            "That's wonderful that you want to relax! 💫 Self-care is important. Would you like to try a breathing exercise, meditation, or some calming music? The Entertainment page has great options!"
        ]
        response_text = random.choice(relax_responses)
        protocol = ["Try a guided meditation", "Listen to calming music", "Practice deep breathing", "Visit the Entertainment page"]
    
    # GRATITUDE
    elif any(word in user_message_lower for word in ['grateful', 'gratitude', 'thankful', 'thanks', 'appreciate']):
        gratitude_responses = [
            "That's wonderful! 🌟 Focusing on gratitude can significantly boost your mood and overall wellbeing. What are you grateful for today? I'd love to hear!",
            "I love that you're practicing gratitude! 💫 It's such a powerful tool for mental health. What's bringing you gratitude right now?",
            "Gratitude is beautiful! 🌟 It helps us see the positive even in difficult times. What are you feeling grateful for? I'm here to celebrate that with you!",
            "That's amazing that you're focusing on gratitude! 💫 It can really shift our perspective. What's one thing you're grateful for today?",
            "I'm so glad you're practicing gratitude! 🌟 It's one of the most powerful wellness tools. What's bringing you joy and gratitude right now?"
        ]
        response_text = random.choice(gratitude_responses)
    
    # EMERGENCY / HELP
    elif any(word in user_message_lower for word in ['emergency', 'critical', 'help', 'suicide', 'hurt myself', 'end it', 'kill myself']):
        emergency_responses = [
            "🚨 I'm here with you, and I want to help. If you're in immediate danger, please contact emergency services (911) or a crisis hotline right away. You matter, and there are people who want to support you. Let's get you the help you need.",
            "🚨 Your safety is the most important thing. If you're in crisis, please reach out to a mental health professional or crisis hotline immediately. You don't have to go through this alone. I'm here, but professional support is essential right now.",
            "🚨 I care about you, and I want you to be safe. If you're having thoughts of self-harm, please contact a crisis hotline or emergency services immediately. There are people trained to help you through this. You matter."
        ]
        response_text = random.choice(emergency_responses)
        response_type = "emergency"
        protocol = ["Contact emergency services (911) if in immediate danger", "Call a crisis hotline", "Reach out to a trusted friend or family member", "Contact a mental health professional"]
    
    # OXYGEN LEVEL CONCERNS
    elif any(word in user_message_lower for word in ['oxygen', 'air', 'breathing', 'can\'t breathe', 'suffocating']):
        oxygen_responses = [
            "If you're having trouble breathing, please seek medical attention immediately. 💫 For general breathing exercises, try the 4-4-4 technique: inhale for 4 counts, hold for 4, exhale for 4. Would you like to try a guided breathing exercise?",
            "Breathing is essential! 🌟 If you're experiencing difficulty breathing, please consult a healthcare professional. For relaxation, try deep breathing exercises or meditation. I can guide you through it.",
            "Your breathing is important! 💫 If you're having serious breathing issues, please seek medical help. For stress-related breathing, try the breathing exercises in the Entertainment section. I'm here to help!"
        ]
        response_text = random.choice(oxygen_responses)
        protocol = ["Seek medical attention if having serious breathing issues", "Try a breathing exercise", "Practice the 4-4-4 breathing technique", "Visit the Entertainment page for guided breathing"]
    
    # GENERAL WELLNESS TIPS
    elif any(word in user_message_lower for word in ['wellness', 'health', 'healthy', 'wellbeing', 'self care', 'self-care', 'tips', 'advice']):
        wellness_responses = [
            "Wellness is a journey, not a destination! 🌟 Some key practices: regular sleep, staying hydrated, movement, mindfulness, and connecting with others. What area would you like to focus on?",
            "Great question! 💫 Wellness includes physical, mental, and emotional health. Some foundations: good sleep, nutrition, exercise, stress management, and social connections. What resonates with you?",
            "Wellness is about balance! 🌟 Key pillars include sleep, nutrition, physical activity, mental health practices, and meaningful connections. What would you like to explore?",
            "I love that you're thinking about wellness! 💫 It's about taking care of your whole self—body, mind, and spirit. What area would you like to focus on? I can suggest specific practices!",
            "Wellness is personal and ongoing! 🌟 Some essentials: quality sleep, balanced nutrition, regular movement, stress management, and social connection. What would help you feel your best?"
        ]
        response_text = random.choice(wellness_responses)
    
    # FALLBACK - SMART RESPONSE
    else:
        fallback_responses = [
            "I may not fully understand, but I'm here for you. Tell me more about what's on your mind. ✨",
            "I'm still learning, but I'm here to listen and support you. Can you help me understand better? 💫",
            "I want to help, but I need a bit more context. What's going on? I'm here with you. 🌟",
            "I'm here for you, even if I don't fully understand yet. Can you tell me more? 💫",
            "Let's explore this together. I may not have all the answers, but I'm here to listen and support you. ✨"
        ]
        response_text = random.choice(fallback_responses)
    
    # Add friendly ending (randomly, 70% chance)
    if random.random() < 0.7:
        endings = [
            " You're doing great. I'm proud of you 🌟",
            " I'm here with you — always. 💫",
            " Let's take it one step at a time. ✨",
            " Remember, you're stronger than you know. 🌟",
            " You've got this! I believe in you. 💫",
            " Take care of yourself. You matter. ✨"
        ]
        response_text += random.choice(endings)
    
    # Add to context
    conversation_context[session_id].append({'role': 'assistant', 'content': response_text})
    
    return jsonify({"response": response_text, "type": response_type, "protocol": protocol})

@app.route('/api/reminders', methods=['GET', 'POST'])
def api_reminders():
    global reminder_id_counter
    if request.method == 'GET':
        return jsonify(reminders_db)
    elif request.method == 'POST':
        data = request.json
        title = data.get('title')
        datetime_str = data.get('datetime')
        description = data.get('description', '')
        category = data.get('category', 'custom')

        if not title or not datetime_str:
            return jsonify({"status": "error", "message": "Title and datetime are required"}), 400

        new_reminder = {
            "id": reminder_id_counter,
            "title": title,
            "description": description,
            "datetime": datetime_str,
            "category": category,
            "completed": False,
            "created_at": datetime.now().isoformat()
        }
        reminders_db.append(new_reminder)
        reminder_id_counter += 1
        return jsonify({"status": "success", "reminder": new_reminder}), 201

@app.route('/api/reminders/<int:reminder_id>', methods=['PUT', 'DELETE'])
def api_single_reminder(reminder_id):
    global reminders_db
    reminder = next((r for r in reminders_db if r["id"] == reminder_id), None)

    if not reminder:
        return jsonify({"status": "error", "message": "Reminder not found"}), 404

    if request.method == 'PUT':
        data = request.json
        if 'completed' in data:
            reminder['completed'] = data['completed']
            if data['completed']:
                reminder['completed_at'] = datetime.now().isoformat()
            else:
                reminder.pop('completed_at', None)
        if 'title' in data:
            reminder['title'] = data['title']
        if 'description' in data:
            reminder['description'] = data['description']
        if 'datetime' in data:
            reminder['datetime'] = data['datetime']
        if 'category' in data:
            reminder['category'] = data['category']
        return jsonify({"status": "success", "reminder": reminder})
    elif request.method == 'DELETE':
        reminders_db = [r for r in reminders_db if r["id"] != reminder_id]
        return jsonify({"status": "success", "message": "Reminder deleted"})

@app.route('/api/knowledge-base', methods=['GET'])
def api_knowledge_base():
    return jsonify(knowledge_base)

# Reminder Stats API
@app.route("/reminder-stats", methods=["GET"])
def reminder_stats():
    try:
        db = get_db()
        cursor = db.cursor()

        # Count active (not completed)
        cursor.execute("SELECT COUNT(*) FROM reminders WHERE completed = 0")
        active = cursor.fetchone()[0]

        # Count completed today
        cursor.execute("""
            SELECT COUNT(*) FROM reminders
            WHERE completed = 1
            AND DATE(completed_at) = DATE('now','localtime')
        """)
        completed_today = cursor.fetchone()[0]

        # Streak (how many consecutive days user completed at least 1)
        cursor.execute("""
            SELECT completed_at FROM reminders
            WHERE completed = 1
            ORDER BY completed_at DESC
        """)
        rows = cursor.fetchall()

        streak = 0
        last_date = None
        for row in rows:
            if row[0] is None:
                continue
            date = row[0].split(" ")[0]  # just YYYY-MM-DD
            if last_date is None:
                last_date = date
                streak += 1
            else:
                from datetime import datetime, timedelta
                try:
                    if datetime.strptime(date, "%Y-%m-%d") == datetime.strptime(last_date, "%Y-%m-%d") - timedelta(days=1):
                        streak += 1
                        last_date = date
                    else:
                        break
                except ValueError:
                    continue

        return jsonify({
            "active": active,
            "completed_today": completed_today,
            "streak": streak
        })
    except Exception as e:
        print("Error getting stats:", e)
        return jsonify({"active": 0, "completed_today": 0, "streak": 0})

# Journal API routes
@app.route('/api/journal', methods=['GET', 'POST'])
def api_journal():
    if request.method == 'GET':
        with get_db() as db:
            entries = db.execute('SELECT * FROM journal_entries ORDER BY created_at DESC').fetchall()
            return jsonify([{
                'id': entry['id'],
                'content': entry['content'],
                'created_at': entry['created_at']
            } for entry in entries])
    elif request.method == 'POST':
        data = request.json
        content = data.get('content', '').strip()
        if not content:
            return jsonify({"status": "error", "message": "Content is required"}), 400

        with get_db() as db:
            cursor = db.execute('INSERT INTO journal_entries (content) VALUES (?)', (content,))
            db.commit()
            entry_id = cursor.lastrowid

        return jsonify({
            "status": "success",
            "entry": {
                "id": entry_id,
                "content": content,
                "created_at": datetime.now().isoformat()
            }
        }), 201

@app.route('/api/journal/delete/<int:entry_id>', methods=['DELETE'])
def api_delete_journal_entry(entry_id):
    with get_db() as db:
        cursor = db.execute('SELECT id FROM journal_entries WHERE id = ?', (entry_id,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": "Journal entry not found"}), 404

        db.execute('DELETE FROM journal_entries WHERE id = ?', (entry_id,))
        db.commit()

    return jsonify({"status": "success", "message": "Journal entry deleted"})

if __name__ == '__main__':
    print("Starting Orbitwell Flask application...")
    print("Server will be available at http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
