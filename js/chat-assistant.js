(function(){
  // ---- Knowledge base: common customer questions & answers ----
  const LT_KB = [
    { q: "How does LifeTap work?", kw: ["how does it work","how it works","how does lifetap work","what is lifetap","what does it do"],
      a: "You store your medical info once in your account. A responder scans your QR code or taps your NFC device, and your emergency profile opens instantly in their browser — no app or login needed on their end." },
    { q: "Do responders need an app?", kw: ["app","download","install","need an app","login needed"],
      a: "No app required for responders. Scanning your QR code or tapping your NFC device opens your profile in any regular web browser. Only you need an account to create and edit your profile." },
    { q: "Is my data secure?", kw: ["secure","security","safe","privacy","encrypted","data protection"],
      a: "Your full account data is encrypted and only accessible to you. You choose exactly which fields appear on your public emergency profile, and can update or remove them anytime." },
    { q: "What if I lose my sticker or card?", kw: ["lose","lost","stolen","missing","replace","replacement"],
      a: "Deactivate the lost device from your dashboard in seconds and order a replacement. Your profile itself stays safe — only the physical device stops working." },
    { q: "Can I update my info later?", kw: ["update","edit","change my info","modify"],
      a: "Yes, as often as you like. Every update syncs immediately, so the next scan always shows your current information." },
    { q: "How much does it cost?", kw: ["price","cost","pricing","how much","plans","subscription","fee"],
      a: "LifeTap has a Free plan for a basic emergency profile, plus paid Starter and Family plans with extra features. Check the Pricing section above for current plan details, or ask me about a specific plan." },
    { q: "Is there a free plan?", kw: ["free plan","free version","is it free"],
      a: "Yes — the Free plan gives you a basic emergency profile at no cost. Paid plans add extra features like additional contacts and premium device options." },
    { q: "QR code vs NFC — what's the difference?", kw: ["qr","nfc","difference","which one","tag","chip"],
      a: "QR stickers scan with any phone camera — no special hardware needed. NFC devices work with a simple tap on any modern smartphone, no camera or app required. Many customers use both." },
    { q: "Does it work without internet or cell signal?", kw: ["offline","no signal","no service","no internet","coverage","remote"],
      a: "The responder's phone needs an internet connection to load your profile after scanning, since it opens in their browser. It doesn't require your phone to have signal — only the scanning device does." },
    { q: "Is it waterproof / durable?", kw: ["waterproof","durable","weather","weatherproof","last"],
      a: "The QR stickers are weatherproof and built to handle daily wear, and the wallet card and wristband are made to be slim and durable for everyday use." },
    { q: "Can I add family members?", kw: ["family","kids","child","children","multiple profiles","spouse"],
      a: "Yes — the Family plan lets you manage emergency profiles for multiple people, like your kids or other family members, from one account." },
    { q: "Can doctors or EMTs access my profile?", kw: ["doctor","emt","paramedic","er","emergency room","physician","responder"],
      a: "Any first responder, doctor, or bystander can view your emergency profile the moment they scan your QR code or tap your NFC device — instantly, with no login required." },
    { q: "How do I cancel my subscription?", kw: ["cancel","unsubscribe","downgrade","refund"],
      a: "You can cancel or change your plan anytime from your account settings/subscription page. Your profile and data stay intact even if you switch back to the Free plan." },
    { q: "How do I get started / sign up?", kw: ["sign up","get started","start","create account","register"],
      a: "Just create a free account, fill in your emergency medical details, and order a QR sticker, NFC tag, card, or wristband to link to your profile. You'll be set up in minutes." },
    { q: "How do I contact support?", kw: ["contact","support","help","talk to someone","human","email you"],
      a: "I can answer most common questions right here. For anything else, use the contact link in the site footer and the team will get back to you." },
  ];

  const LT_SUGGESTIONS = ["How does LifeTap work?","Is my data secure?","How much does it cost?","QR code vs NFC?"];

  const LT_FALLBACK = "I don't have a specific answer for that yet, but here are some things I can help with. You can also check the FAQ section above or contact the team via the footer for anything more specific.";

  let ltOpened = false;
  // forwarding mini-flow state: null, 'awaiting-forward-choice', or 'awaiting-email'
  let ltForwardState = null;
  let ltPendingQuestion = null;

  // remembers the last email this visitor gave us (this browser only), so we can
  // greet them with any admin reply the next time they open the chat
  const LT_VISITOR_EMAIL_KEY = 'lifetap_visitor_email';
  function ltGetVisitorEmail(){
    try { return localStorage.getItem(LT_VISITOR_EMAIL_KEY) || ''; }
    catch(e){ return ''; }
  }
  function ltSetVisitorEmail(email){
    try { localStorage.setItem(LT_VISITOR_EMAIL_KEY, email); }
    catch(e){}
  }

  // looks up any admin-answered questions tied to this visitor's email that
  // haven't been shown to them yet, and marks them delivered
  function ltCheckForReplies(){
    const email = ltGetVisitorEmail();
    if(!email) return [];
    const list = loadChatbotQuestions();
    const replies = list.filter(q => q.email && q.email.toLowerCase() === email.toLowerCase() && q.answered && !q.delivered);
    if(replies.length){
      replies.forEach(q => { q.delivered = true; });
      saveChatbotQuestions(list);
    }
    return replies;
  }

  function ltFindAnswer(text){
    const t = text.toLowerCase();
    let best = null, bestScore = 0;
    LT_KB.forEach(item=>{
      item.kw.forEach(k=>{
        if(t.includes(k) && k.length > bestScore){ best = item; bestScore = k.length; }
      });
    });
    return best ? best.a : null;
  }

  function ltScrollToBottom(){
    const body = document.getElementById('ltChatBody');
    body.scrollTop = body.scrollHeight;
  }

  function ltAddMessage(text, sender){
    const body = document.getElementById('ltChatBody');
    const div = document.createElement('div');
    div.className = 'lt-msg ' + (sender === 'user' ? 'lt-msg-user' : 'lt-msg-bot');
    div.textContent = text;
    body.appendChild(div);
    ltScrollToBottom();
  }

  function ltAddChips(list){
    const body = document.getElementById('ltChatBody');
    const wrap = document.createElement('div');
    wrap.className = 'lt-chips';
    list.forEach(q=>{
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'lt-chip';
      chip.textContent = q;
      chip.onclick = ()=> ltHandleUserInput(q);
      wrap.appendChild(chip);
    });
    body.appendChild(wrap);
    ltScrollToBottom();
  }

  function ltShowTyping(){
    const body = document.getElementById('ltChatBody');
    const typing = document.createElement('div');
    typing.className = 'lt-typing';
    typing.id = 'ltTypingIndicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    ltScrollToBottom();
  }

  function ltHideTyping(){
    const t = document.getElementById('ltTypingIndicator');
    if(t) t.remove();
  }

  function ltEmailLooksValid(text){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
  }

  function ltHandleUserInput(text){
    if(!text || !text.trim()) return;
    ltAddMessage(text, 'user');

    // mini-flow: we already asked whether to forward the unanswered question
    if(ltForwardState === 'awaiting-forward-choice'){
      ltHandleForwardChoice(text.trim());
      return;
    }
    // mini-flow: we're waiting on the visitor's email so the team can reply
    if(ltForwardState === 'awaiting-email'){
      ltShowTyping();
      setTimeout(()=>{
        ltHideTyping();
        if(text.trim().toLowerCase() === 'skip'){
          forwardChatbotQuestion(ltPendingQuestion, '');
          ltAddMessage("No problem — I've forwarded your question to our team without an email on file.", 'bot');
          ltForwardState = null;
          ltPendingQuestion = null;
          ltAddChips(LT_SUGGESTIONS);
          return;
        }
        if(!ltEmailLooksValid(text)){
          ltAddMessage("That doesn't look like a valid email — mind trying again? Or type \"skip\" to send it without one.", 'bot');
          return;
        }
        ltSetVisitorEmail(text.trim());
        forwardChatbotQuestion(ltPendingQuestion, text.trim());
        ltAddMessage("Thanks! I've forwarded your question to our team — they'll follow up at that email address.", 'bot');
        ltAddMessage("Next time you open this chat, I'll show their reply here for you automatically.", 'bot');
        ltForwardState = null;
        ltPendingQuestion = null;
        ltAddMessage("Anything else I can help with?", 'bot');
        ltAddChips(LT_SUGGESTIONS);
      }, 550 + Math.random()*300);
      return;
    }

    ltShowTyping();
    setTimeout(()=>{
      ltHideTyping();
      const answer = ltFindAnswer(text);
      ltAddMessage(answer || LT_FALLBACK, 'bot');
      if(!answer){
        ltPendingQuestion = text.trim();
        ltForwardState = 'awaiting-forward-choice';
        ltAddMessage("Want me to forward this question to our team so they can get back to you directly?", 'bot');
        ltAddChips(["Yes, forward it", "No thanks"]);
      } else {
        ltAddChips(LT_SUGGESTIONS);
      }
    }, 550 + Math.random()*350);
  }

  function ltHandleForwardChoice(text){
    const t = text.toLowerCase();
    if(t.includes('yes')){
      ltShowTyping();
      setTimeout(()=>{
        ltHideTyping();
        ltForwardState = 'awaiting-email';
        ltAddMessage("Great — what's the best email to reach you at? (Or type \"skip\" to send it without one.)", 'bot');
      }, 450 + Math.random()*250);
    } else if(t.toLowerCase() === 'skip'){
      forwardChatbotQuestion(ltPendingQuestion, '');
      ltForwardState = null;
      ltPendingQuestion = null;
      ltAddMessage("No problem — I've forwarded your question to our team without an email on file.", 'bot');
      ltAddChips(LT_SUGGESTIONS);
    } else {
      ltForwardState = null;
      ltPendingQuestion = null;
      ltShowTyping();
      setTimeout(()=>{
        ltHideTyping();
        ltAddMessage("No problem! Is there anything else I can help with?", 'bot');
        ltAddChips(LT_SUGGESTIONS);
      }, 450 + Math.random()*250);
    }
  }

  function ltInit(){
    if(ltOpened) return;
    ltOpened = true;
    ltAddMessage("Hi! I'm the LifeTap Assistant. Ask me anything about how LifeTap works, pricing, security, or setup — or tap a question below.", 'bot');

    const replies = ltCheckForReplies();
    if(replies.length){
      ltShowTyping();
      setTimeout(()=>{
        ltHideTyping();
        ltAddMessage(replies.length === 1
          ? "Also — our team replied to a question you sent in:"
          : "Also — our team replied to some questions you sent in:", 'bot');
        replies.forEach(q => {
          ltAddMessage('You asked: "' + q.question + '"', 'user');
          ltAddMessage(q.answer, 'bot');
        });
        ltAddChips(LT_SUGGESTIONS);
      }, 500 + Math.random()*300);
    } else {
      ltAddChips(LT_SUGGESTIONS);
    }
  }

  document.getElementById('ltChatToggle').addEventListener('click', function(){
    const panel = document.getElementById('ltChatPanel');
    const open = panel.classList.toggle('open');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    if(open){ ltInit(); document.getElementById('ltChatInput').focus(); }
  });

  document.getElementById('ltChatClose').addEventListener('click', function(){
    document.getElementById('ltChatPanel').classList.remove('open');
    document.getElementById('ltChatToggle').setAttribute('aria-expanded','false');
  });

  document.getElementById('ltChatFooter').addEventListener('submit', function(e){
    e.preventDefault();
    const input = document.getElementById('ltChatInput');
    const val = input.value;
    input.value = '';
    ltHandleUserInput(val);
  });

  if(window.lucide) lucide.createIcons();
})();