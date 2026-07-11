/**
 * Calculate time ago from timestamp
 * @param {string} ts - ISO timestamp
 * @returns {string} Formatted time ago string
 */
export function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

/**
 * Get demo response based on user input
 * @param {string} text - User input text
 * @param {object} ctx - Stadium context data
 * @param {string} language - Selected language
 * @returns {string} AI response
 */
export function getDemoResponse(text, ctx, language = 'en') {
  const { gates = [], transportOptions = [], stadium = {}, accessibilityServices = [] } = ctx || {};

  // Ensure text is lowercase for matching
  const lowerText = text.toLowerCase();

  // Find best gate
  const bestGate = [...gates].sort((a, b) => a.density - b.density)[0] || {};
  // Find worst gate
  const worstGate = [...gates].sort((a, b) => b.density - a.density)[0] || {};

  // Find best transport
  const bestTransport = transportOptions.find((t) => t.recommended) || transportOptions[0] || {};

  // Get accessibility info
  const accessibilityInfo = accessibilityServices
    .map(
      (s) =>
        `• **${s.type}**: ${(Array.isArray(s.locations) ? s.locations : []).join(', ')} — ${s.description || ''}`,
    )
    .join('\n');

  // Demo responses based on language
  const responses = {
    en: {
      gate: `🚪 The least congested gate is **Gate ${bestGate.id}** (${bestGate.direction} side) with a **${bestGate.waitTimeMinutes}-minute wait** (${Math.round(bestGate.density * 100)}% density) compared to **Gate ${worstGate.id}** which has a **${worstGate.waitTimeMinutes}-minute wait**. Entering/exiting via Gate ${bestGate.id} is less crowded and **saves you ~${Math.max(0, worstGate.waitTimeMinutes - bestGate.waitTimeMinutes)} minutes**! ${bestGate.accessible ? '♿ It is wheelchair accessible.' : ''}`,
      transport: `🚌 Best post-match option: **${bestTransport.type}** (${bestTransport.line}) — arrives in **${bestTransport.etaMinutes} minutes** with ${bestTransport.capacityLeft} spots. CO₂: only ${bestTransport.co2e}g/km — eco-friendly choice! 🌱`,
      weather: `🌤️ Currently **${stadium.weather?.temperature}°C** (feels like ${stadium.weather?.feelsLike}°C), ${stadium.weather?.conditions} skies with ${stadium.weather?.humidity}% humidity. Stay hydrated — water stations are at every gate entrance!`,
      crowd: `📊 Stadium is at **${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% capacity** (${stadium.currentOccupancy?.toLocaleString()} fans). East Wing is the busiest zone. For comfort, try the **North Stand** area.`,
      eco: `♻️ Great question! Today we've saved **${stadium.sustainability?.co2SavedKg?.toLocaleString()}kg of CO₂** using ${stadium.sustainability?.renewablePercentage}% renewable energy. Waste diversion rate is ${stadium.sustainability?.wasteDiversionRate}%. Take public transit home to help us reach net zero! 🌍`,
      accessible: `♿ **Accessibility Services Available:**\n\n${accessibilityInfo}\n\nNeed specific directions? Ask me about any accessibility service! ♿`,
      food: `🍔 **Nearby Food Options:**\n• North Stand: Pizza, hot dogs, nachos (Sections 112-130)\n• East Wing: Healthy wraps & salads (Section 215)\n• South Stand: Classic American burgers (Section 144)\n• West Wing: Vegetarian/vegan options (Section 308)`,
      parking: `🅿️ **Parking Availability:**\n• Lot C: ${Math.max(0, 240 - Math.floor(stadium.currentOccupancy / 250))} spots left — 12 min walk\n• Garage A: ${Math.max(0, 180 - Math.floor(stadium.currentOccupancy / 300))} spots left — 8 min walk\n• Lot D: ${Math.max(0, 300 - Math.floor(stadium.currentOccupancy / 200))} spots left — 15 min walk`,
      merch: `🛍️ **Official Merchandise Stands:**\n• Main Concourse: Jerseys, scarves, FIFA 2026 memorabilia\n• East Wing: Team-specific merchandise\n• West Wing: Eco-friendly apparel \n• Family Zone (North Stand): Kid's merchandise`,
      default: `🏟️ Welcome to **${stadium.name}**! Today's match: **${stadium.homeTeam} vs ${stadium.awayTeam}** (${stadium.score}, ${stadium.matchPhase}). How can I assist you? Ask about gates, transport, accessibility, weather, or crowd conditions!`,
    },
    es: {
      gate: `🚪 La puerta menos congestionada es **Puerta ${bestGate.id}** (lado ${bestGate.direction === 'North' ? 'Norte' : bestGate.direction === 'South' ? 'Sur' : bestGate.direction}) con solo **${bestGate.waitTimeMinutes} minutos de espera** (${Math.round(bestGate.density * 100)}% de densidad) en comparación con **Puerta ${worstGate.id}** (${worstGate.waitTimeMinutes} min). ¡Usar la Puerta ${bestGate.id} le **ahorra ~${Math.max(0, worstGate.waitTimeMinutes - bestGate.waitTimeMinutes)} minutos**!`,
      transport: `🚌 La mejor opción tras el partido: **${bestTransport.type}** (${bestTransport.line}) — llega en **${bestTransport.etaMinutes} minutos** con ${bestTransport.capacityLeft} plazas. CO₂: solo ${bestTransport.co2e}g/km — ¡opción ecológica! 🌱`,
      weather: `🌤️ Actualmente **${stadium.weather?.temperature}°C** (sensación de ${stadium.weather?.feelsLike}°C), cielo ${stadium.weather?.conditions} con ${stadium.weather?.humidity}% de humedad. ¡Mantente hidratado!`,
      crowd: `📊 El estadio está al **${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% de capacidad** (${stadium.currentOccupancy?.toLocaleString()} aficionados). La zona Este es la más concurrida. Para mayor comodidad, prueba la **Tribuna Norte**.`,
      eco: `♻️ ¡Hoy hemos ahorrado **${stadium.sustainability?.co2SavedKg?.toLocaleString()}kg de CO₂** usando ${stadium.sustainability?.renewablePercentage}% de energía renovable. Tasa de desviación de residuos: ${stadium.sustainability?.wasteDiversionRate}%. ¡Usa el transporte público! 🌍`,
      accessible: `♿ **Servicios de Accesibilidad Disponibles:**\n\n${accessibilityInfo}\n\n¿Necesitas indicaciones específicas? ¡Pregúntame!`,
      food: `🍔 **Opciones de Comida:**\n• Tribuna Norte: Pizza, perritos, nachos (Secciones 112-130)\n• Ala Este: Wraps saludables y ensaladas (Sección 215)\n• Tribuna Sur: Hamburguesas (Sección 144)\n• Ala Oeste: Opciones veganas/vegetarianas (Sección 308)`,
      parking: `🅿️ **Disponibilidad de Aparcamiento:**\n• Lote C: ${Math.max(0, 240 - Math.floor(stadium.currentOccupancy / 250))} plazas — 12 min a pie\n• Garaje A: ${Math.max(0, 180 - Math.floor(stadium.currentOccupancy / 300))} plazas — 8 min a pie`,
      merch: `🛍️ **Tiendas Oficiales:**\n• Concourse Principal: Camisetas, bufandas, recuerdos FIFA 2026\n• Ala Este: Merchandising por equipos\n• Ala Oeste: Ropa ecológica`,
      default: `🏟️ ¡Bienvenido a **${stadium.name}**! Partido de hoy: **${stadium.homeTeam} vs ${stadium.awayTeam}** (${stadium.score}, ${stadium.matchPhase}). ¿En qué puedo ayudarte? Pregunta sobre entradas, transporte, accesibilidad, clima o afluencia.`,
    },
    fr: {
      gate: `🚪 La porte la moins encombrée est la **Porte ${bestGate.id}** (côté ${bestGate.direction === 'North' ? 'Nord' : bestGate.direction === 'South' ? 'Sud' : bestGate.direction}) avec seulement **${bestGate.waitTimeMinutes} minutes d'attente** (${Math.round(bestGate.density * 100)}% de densité) par rapport à la **Porte ${worstGate.id}** (${worstGate.waitTimeMinutes} min). Passer par la Porte ${bestGate.id} vous **économise ~${Math.max(0, worstGate.waitTimeMinutes - bestGate.waitTimeMinutes)} minutes**!`,
      transport: `🚌 Meilleure option après le match : **${bestTransport.type}** (${bestTransport.line}) — arrive dans **${bestTransport.etaMinutes} minutes** avec ${bestTransport.capacityLeft} places. CO₂ : seulement ${bestTransport.co2e}g/km — choix écologique ! 🌱`,
      weather: `🌤️ Actuellement **${stadium.weather?.temperature}°C** (ressenti ${stadium.weather?.feelsLike}°C), ciel ${stadium.weather?.conditions} avec ${stadium.weather?.humidity}% d'humidité. Restez hydraté !`,
      crowd: `📊 Le stade est à **${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% de sa capacité** (${stadium.currentOccupancy?.toLocaleString()} supporters). L'aile Est est la plus fréquentée. Pour plus de confort, essayez la **Tribune Nord**.`,
      eco: `♻️ Aujourd'hui nous avons économisé **${stadium.sustainability?.co2SavedKg?.toLocaleString()}kg de CO₂** grâce à ${stadium.sustainability?.renewablePercentage}% d'énergie renouvelable. Taux de valorisation des déchets : ${stadium.sustainability?.wasteDiversionRate}%. Prenez les transports en commun ! 🌍`,
      accessible: `♿ **Services d'Accessibilité Disponibles :**\n\n${accessibilityInfo}\n\nBesoin d'indications spécifiques ? Demandez-moi !`,
      food: `🍔 **Options Restauration :**\n• Tribune Nord : Pizza, hot-dogs, nachos (Sections 112-130)\n• Aile Est : Wraps sains et salades (Section 215)\n• Tribune Sud : Burgers classiques (Section 144)\n• Aile Ouest : Options végétaliens/végétariens (Section 308)`,
      parking: `🅿️ **Disponibilité Parking :**\n• Lot C : ${Math.max(0, 240 - Math.floor(stadium.currentOccupancy / 250))} places — 12 min à pied\n• Garage A : ${Math.max(0, 180 - Math.floor(stadium.currentOccupancy / 300))} places — 8 min à pied`,
      merch: `🛍️ **Boutiques Officielles :**\n• Concourse Principal : Maillots, écharpes, souvenirs FIFA 2026\n• Aile Est : Merchandising par équipe\n• Aile Ouest : Vêtements écologiques`,
      default: `🏟️ Bienvenue à **${stadium.name}** ! Match du jour : **${stadium.homeTeam} vs ${stadium.awayTeam}** (${stadium.score}, ${stadium.matchPhase}). Comment puis-je vous aider ? Renseignez-vous sur les portes, transports, accessibilité, météo ou affluence !`,
    },
    ar: {
      gate: `🚪 البوابة الأقل ازدحاماً هي **البوابة ${bestGate.id}** (الجانب ${bestGate.direction === 'North' ? 'الشمالي' : bestGate.direction === 'South' ? 'الجنوبي' : bestGate.direction}) بانتظار **${bestGate.waitTimeMinutes} دقائق فقط** (${Math.round(bestGate.density * 100)}% كثافة) مقارنة بالبوابة **Gate ${worstGate.id}** (${worstGate.waitTimeMinutes} دقيقة). دخولك/خروجك عبر البوابة ${bestGate.id} **يوفر عليك ~${Math.max(0, worstGate.waitTimeMinutes - bestGate.waitTimeMinutes)} دقائق**!`,
      transport: `🚌 أفضل خيار بعد المباراة: **${bestTransport.type}** (${bestTransport.line}) — يصل خلال **${bestTransport.etaMinutes} دقيقة** مع ${bestTransport.capacityLeft} مقعداً. CO₂: ${bestTransport.co2e}غ/كم فقط — خيار صديق للبيئة! 🌱`,
      weather: `🌤️ حالياً **${stadium.weather?.temperature}°م** (الإحساس ${stadium.weather?.feelsLike}°م)، سماء ${stadium.weather?.conditions} مع ${stadium.weather?.humidity}% رطوبة. حافظ على ترطيب جسمك!`,
      crowd: `📊 الملعب عند **${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% من طاقته** (${stadium.currentOccupancy?.toLocaleString()} مشجع). الجناح الشرقي هو الأكثر ازدحاماً. للراحة، جرب **المدرج الشمالي**.`,
      eco: `♻️ اليوم وفّرنا **${stadium.sustainability?.co2SavedKg?.toLocaleString()}كغ من CO₂** باستخدام ${stadium.sustainability?.renewablePercentage}% طاقة متجددة. معدل تحويل النفايات: ${stadium.sustainability?.wasteDiversionRate}%. استخدم المواصلات العامة! 🌍`,
      accessible: `♿ **خدمات الإتاحة المتاحة:**\n\n${accessibilityInfo}\n\nهل تحتاج إلى إرشادات محددة؟ اسألني!`,
      food: `🍔 **خيارات الطعام:**\n• المدرج الشمالي: بيتزا، هوت دوج، ناتشوز (الأقسام 112-130)\n• الجناح الشرقي: ملفوفات صحية وسلطات (القسم 215)\n• المدرج الجنوبي: برغر كلاسيكي (القسم 144)`,
      parking: `🅿️ **توفر مواقف السيارات:**\n• الموقف C: ${Math.max(0, 240 - Math.floor(stadium.currentOccupancy / 250))} مكان — 12 دقيقة سيراً\n• الكراج A: ${Math.max(0, 180 - Math.floor(stadium.currentOccupancy / 300))} مكان — 8 دقائق سيراً`,
      merch: `🛍️ **متاجر البضائع الرسمية:**\n• الردهة الرئيسية: قمصان، أوشحة، تذكارات كأس العالم 2026\n• الجناح الشرقي: بضائع خاصة بالفرق`,
      default: `🏟️ مرحباً بك في **${stadium.name}**! مباراة اليوم: **${stadium.homeTeam} مقابل ${stadium.awayTeam}** (${stadium.score}، ${stadium.matchPhase}). كيف يمكنني مساعدتك؟ اسأل عن البوابات أو المواصلات أو الإتاحة أو الطقس!`,
    },
    pt: {
      gate: `🚪 O portão menos congestionado é o **Portão ${bestGate.id}** (lado ${bestGate.direction === 'North' ? 'Norte' : bestGate.direction === 'South' ? 'Sul' : bestGate.direction}) com apenas **${bestGate.waitTimeMinutes} minutos de espera** (${Math.round(bestGate.density * 100)}% de densidade) em comparação com o **Portão ${worstGate.id}** (${worstGate.waitTimeMinutes} min). Usar o Portão ${bestGate.id} lhe **economiza ~${Math.max(0, worstGate.waitTimeMinutes - bestGate.waitTimeMinutes)} minutos**!`,
      transport: `🚌 Melhor opção pós-jogo: **${bestTransport.type}** (${bestTransport.line}) — chega em **${bestTransport.etaMinutes} minutos** com ${bestTransport.capacityLeft} vagas. CO₂: apenas ${bestTransport.co2e}g/km — escolha ecológica! 🌱`,
      weather: `🌤️ Atualmente **${stadium.weather?.temperature}°C** (sensação de ${stadium.weather?.feelsLike}°C), céu ${stadium.weather?.conditions} com ${stadium.weather?.humidity}% de umidade. Mantenha-se hidratado!`,
      crowd: `📊 O estádio está a **${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% da capacidade** (${stadium.currentOccupancy?.toLocaleString()} torcedores). A ala Leste é a mais movimentada. Para mais conforto, tente a **Arquibancada Norte**.`,
      eco: `♻️ Hoje economizamos **${stadium.sustainability?.co2SavedKg?.toLocaleString()}kg de CO₂** usando ${stadium.sustainability?.renewablePercentage}% de energia renovável. Taxa de desvio de resíduos: ${stadium.sustainability?.wasteDiversionRate}%. Use transporte público! 🌍`,
      accessible: `♿ **Serviços de Acessibilidade Disponíveis:**\n\n${accessibilityInfo}\n\nPrecisa de direções específicas? Pergunte-me!`,
      food: `🍔 **Opções de Alimentação:**\n• Arquibancada Norte: Pizza, cachorro-quente, nachos (Seções 112-130)\n• Ala Leste: Wraps saudáveis e saladas (Seção 215)\n• Arquibancada Sul: Hambúrgueres (Seção 144)\n• Ala Oeste: Opções veganas/vegetarianas (Seção 308)`,
      parking: `🅿️ **Disponibilidade de Estacionamento:**\n• Lote C: ${Math.max(0, 240 - Math.floor(stadium.currentOccupancy / 250))} vagas — 12 min a pé\n• Garagem A: ${Math.max(0, 180 - Math.floor(stadium.currentOccupancy / 300))} vagas — 8 min a pé`,
      merch: `🛍️ **Lojas Oficiais:**\n• Concourse Principal: Camisas, cachecóis, souvenirs da Copa 2026\n• Ala Leste: Mercadoria por equipes\n• Ala Oeste: Roupas ecológicas`,
      default: `🏟️ Bem-vindo ao **${stadium.name}**! Jogo de hoje: **${stadium.homeTeam} vs ${stadium.awayTeam}** (${stadium.score}, ${stadium.matchPhase}). Como posso ajudá-lo? Pergunte sobre portões, transporte, acessibilidade, clima ou lotação!`,
    },
    ja: {
      gate: `🚪 現在最も混雑が少ないのは **ゲート${bestGate.id}** (${bestGate.direction === 'North' ? '北' : bestGate.direction === 'South' ? '南' : bestGate.direction}側) で、待ち時間は **${bestGate.waitTimeMinutes}分** (${Math.round(bestGate.density * 100)}% 混雑) です。**ゲート${worstGate.id}** (${worstGate.waitTimeMinutes}分) と比較して、ゲート${bestGate.id}を利用することで **約${Math.max(0, worstGate.waitTimeMinutes - bestGate.waitTimeMinutes)}分の待ち時間を短縮** できます！`,
      transport: `🚌 試合後のベスト移動手段: **${bestTransport.type}** (${bestTransport.line}) — **${bestTransport.etaMinutes}分後**到着、空席${bestTransport.capacityLeft}席。CO₂排出量わずか${bestTransport.co2e}g/km — エコな選択です! 🌱`,
      weather: `🌤️ 現在 **${stadium.weather?.temperature}℃** (体感${stadium.weather?.feelsLike}℃)、${stadium.weather?.conditions}空、湿度${stadium.weather?.humidity}%。各ゲート入口の給水ポイントで水分補給を！`,
      crowd: `📊 スタジアムは**定員の${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}%**が入場中(${stadium.currentOccupancy?.toLocaleString()}人)。東スタンドが最も混雑しています。快適にご観戦するなら**北スタンド**エリアをお試しください。`,
      eco: `♻️ 本日は再生可能エネルギー${stadium.sustainability?.renewablePercentage}%の活用により**${stadium.sustainability?.co2SavedKg?.toLocaleString()}kgのCO₂**を削減しました。廃棄物リサイクル率: ${stadium.sustainability?.wasteDiversionRate}%。公共交通機関でカーボンニュートラルに貢献しましょう! 🌍`,
      accessible: `♿ **ご利用可能なアクセシビリティサービス:**\n\n${accessibilityInfo}\n\n具体的な案内が必要ですか？お気軽にお尋ねください!`,
      food: `🍔 **近くのフード情報:**\n• 北スタンド: ピザ、ホットドッグ、ナチョス (112-130番エリア)\n• 東ウィング: ヘルシーラップ・サラダ (215番)\n• 南スタンド: バーガー (144番)\n• 西ウィング: ヴィーガン・ベジタリアン (308番)`,
      parking: `🅿️ **駐車場空き状況:**\n• Cロット: ${Math.max(0, 240 - Math.floor(stadium.currentOccupancy / 250))}台 — 徒歩12分\n• Aガレージ: ${Math.max(0, 180 - Math.floor(stadium.currentOccupancy / 300))}台 — 徒歩8分`,
      merch: `🛍️ **公式グッズ売場:**\n• メインコンコース: ユニフォーム、マフラー、FIFA 2026記念品\n• 東ウィング: チーム別グッズ\n• 西ウィング: エコ素材アパレル`,
      default: `🏟️ **${stadium.name}**へようこそ！本日の試合: **${stadium.homeTeam} vs ${stadium.awayTeam}** (${stadium.score}、${stadium.matchPhase})。ゲート・交通・バリアフリー・天気・混雑状況などお気軽にご質問ください！`,
    },
    hi: {
      gate: `🚪 अभी सबसे कम भीड़ वाला गेट **गेट ${bestGate.id}** (${bestGate.direction === 'North' ? 'उत्तर' : bestGate.direction === 'South' ? 'दक्षिण' : bestGate.direction} दिशा) है, जहाँ केवल **${bestGate.waitTimeMinutes} मिनट का इंतज़ार** (${Math.round(bestGate.density * 100)}% घनत्व) है, जबकि **गेट ${worstGate.id}** पर **${worstGate.waitTimeMinutes} मिनट** का इंतज़ार है। गेट ${bestGate.id} से प्रवेश/निकास करने पर **लगभग ${Math.max(0, worstGate.waitTimeMinutes - bestGate.waitTimeMinutes)} मिनट का समय बचेगा**!`,
      transport: `🚌 मैच के बाद सबसे अच्छा विकल्प: **${bestTransport.type}** (${bestTransport.line}) — **${bestTransport.etaMinutes} मिनट** में आएगा, ${bestTransport.capacityLeft} सीटें उपलब्ध। CO₂: केवल ${bestTransport.co2e}g/km — पर्यावरण-अनुकूल! 🌱`,
      weather: `🌤️ अभी **${stadium.weather?.temperature}°C** (महसूस होता है ${stadium.weather?.feelsLike}°C), ${stadium.weather?.conditions} आसमान, नमी ${stadium.weather?.humidity}%। हाइड्रेटेड रहें — हर गेट पर पानी के स्टेशन हैं!`,
      crowd: `📊 स्टेडियम **${Math.round((stadium.currentOccupancy / stadium.capacity) * 100)}% क्षमता** पर है (${stadium.currentOccupancy?.toLocaleString()} दर्शक)। पूर्वी विंग सबसे व्यस्त है। आराम के लिए **उत्तरी स्टैंड** क्षेत्र आज़माएँ।`,
      eco: `♻️ आज हमने ${stadium.sustainability?.renewablePercentage}% नवीकरणीय ऊर्जा से **${stadium.sustainability?.co2SavedKg?.toLocaleString()}kg CO₂** बचाई। कचरा पुनर्चक्रण दर: ${stadium.sustainability?.wasteDiversionRate}%। नेट ज़ीरो के लिए सार्वजनिक परिवहन लें! 🌍`,
      accessible: `♿ **उपलब्ध एक्सेसिबिलिटी सेवाएँ:**\n\n${accessibilityInfo}\n\nविशेष निर्देश चाहिए? मुझसे पूछें!`,
      food: `🍔 **पास के खाने के विकल्प:**\n• उत्तरी स्टैंड: पिज्ज़ा, हॉट डॉग, नाचोस (सेक्शन 112-130)\n• पूर्वी विंग: हेल्दी रैप्स और सलाद (सेक्शन 215)\n• दक्षिणी स्टैंड: बर्गर (सेक्शन 144)\n• पश्चिमी विंग: वेगन/शाकाहारी विकल्प (सेक्शन 308)`,
      parking: `🅿️ **पार्किंग उपलब्धता:**\n• लॉट C: ${Math.max(0, 240 - Math.floor(stadium.currentOccupancy / 250))} जगहें — 12 मिनट पैदल\n• गैरेज A: ${Math.max(0, 180 - Math.floor(stadium.currentOccupancy / 300))} जगहें — 8 मिनट पैदल`,
      merch: `🛍️ **आधिकारिक मर्चेंडाइज़ स्टॉल्स:**\n• मुख्य कॉनकोर्स: जर्सी, स्कार्फ, FIFA 2026 स्मृति चिह्न\n• पूर्वी विंग: टीम-विशेष मर्चेंडाइज़\n• पश्चिमी विंग: इको-फ्रेंडली परिधान`,
      default: `🏟️ **${stadium.name}** में आपका स्वागत है! आज का मैच: **${stadium.homeTeam} बनाम ${stadium.awayTeam}** (${stadium.score}, ${stadium.matchPhase})। मैं आपकी कैसे मदद कर सकता हूँ? गेट, परिवहन, एक्सेसिबिलिटी, मौसम, या भीड़ के बारे में पूछें!`,
    },
  };

  // Language fallback
  const langResponses = responses[language] || responses.en;

  // Check each matcher in priority order using pre-compiled regex
  for (const matcher of MATCHERS) {
    for (const regex of matcher.regexps) {
      if (regex.test(lowerText)) {
        return matcher.getResponse(langResponses);
      }
    }
  }

  return langResponses.default;
}

// Pre-compiled keyword regex patterns for getDemoResponse
const COMPILED_KEYWORDS = {};
function getMatcherRegex(keyword) {
  if (!COMPILED_KEYWORDS[keyword]) {
    COMPILED_KEYWORDS[keyword] = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i',
    );
  }
  return COMPILED_KEYWORDS[keyword];
}

const MATCHER_CONFIGS = [
  {
    keys: [
      'accessible',
      'wheelchair',
      'disability',
      'handicap',
      'hearing',
      'blind',
      'service animal',
      'sign language',
      'braille',
      'mobility',
      'deaf',
      'visual',
    ],
    res: 'accessible',
  },
  { keys: ['restaurant', 'food', 'eat', 'snack', 'meal', 'drink'], res: 'food' },
  { keys: ['parking', 'car', 'vehicle', 'garage', 'lot'], res: 'parking' },
  { keys: ['merch', 'shop', 'store', 'jersey', 'souvenir', 'apparel'], res: 'merch' },
  {
    keys: ['transport', 'metro', 'bus', 'subway', 'train', 'depart', 'shuttle', 'rideshare'],
    res: 'transport',
  },
  { keys: ['temperature', 'weather', 'rain', 'hot', 'cold', 'humidity'], res: 'weather' },
  { keys: ['eco', 'green', 'sustain', 'carbon', 'environment', 'renewable'], res: 'eco' },
  { keys: ['crowd', 'busy', 'full', 'capacity', 'density'], res: 'crowd' },
  { keys: ['gate', 'entrance', 'door', 'enter', 'entry'], res: 'gate' },
];

const MATCHERS = MATCHER_CONFIGS.map((cfg) => ({
  regexps: cfg.keys.map(getMatcherRegex),
  getResponse: (langRes) => langRes[cfg.res],
}));

/**
 * Render markdown for AI messages
 * @param {string} text - Markdown text
 * @returns {string} Rendered HTML
 */
export function renderMarkdown(text) {
  // Bold: **text**
  let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Bullet points
  result = result.replace(/^• (.+)$/gm, '<li>$1</li>');
  result = result.replace(
    /(<li>.*<\/li>\n?)+/gs,
    (match) => `<ul style="margin: 6px 0; padding-left: 16px;">${match}</ul>`,
  );
  // Line breaks (avoid <br> inside <ul>)
  result = result.replace(/\n/g, '<br/>');
  result = result.replace(/<\/li><br\/>/g, '</li>');
  result = result.replace(/<br\/><\/ul>/g, '</ul>');
  return result;
}

/**
 * Calculate load bar color
 * @param {number} current - Current load
 * @param {number} max - Max load
 * @returns {string} Color CSS value
 */
export function getLoadBarColor(current, max) {
  const pct = Math.round((current / max) * 100);
  if (pct >= 100) return 'var(--color-status-critical)';
  if (pct >= 60) return 'var(--color-status-busy)';
  return 'var(--color-status-nominal)';
}

/**
 * Calculate density color
 * @param {number} density - Density value (0-1)
 * @returns {string} Color CSS value
 */
export function getDensityColor(density) {
  if (density > 0.85) return 'var(--color-status-critical)';
  if (density > 0.65) return 'var(--color-status-busy)';
  return 'var(--color-status-nominal)';
}

/**
 * Map gate status to a color
 * @param {string} status - Gate status
 * @returns {string} Color CSS value
 */
export function getStatusColor(status) {
  if (status === 'critical') return 'var(--color-status-critical)';
  if (status === 'watch') return 'var(--color-status-busy)';
  return 'var(--color-status-nominal)';
}

/**
 * Map CO₂ emissions to a color
 * @param {number} co2e - CO₂ emissions value
 * @returns {string} Color CSS value
 */
export function getCO2Color(co2e) {
  if (co2e === 0) return 'var(--color-success)';
  if (co2e <= 10) return 'var(--color-tertiary)';
  if (co2e <= 20) return 'var(--color-secondary-container)';
  if (co2e <= 40) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/**
 * Map incident severity to color
 * @param {string} severity - Severity level
 * @returns {string} Color CSS value
 */
export function getSeverityColor(severity) {
  if (severity === 'critical') return 'var(--color-error)';
  if (severity === 'medium') return 'var(--color-warning)';
  return 'var(--color-info)';
}

/**
 * Get capacity indicator color based on remaining seats
 * @param {number} seatsLeft - Remaining seat count
 * @returns {string} Color CSS value
 */
export function getCapacityColor(seatsLeft) {
  if (seatsLeft <= 5) return 'var(--color-error)';
  if (seatsLeft <= 20) return 'var(--color-warning)';
  return 'var(--color-success)';
}

// =========================================
// XAI REASONING HELPERS (Task 1 — inline Explainable AI)
// Pure deterministic functions computed from existing gate/incident data.
// No extra API calls needed.
// =========================================

export function generateXaiReasoning(gates, language = 'en') {
  if (!gates || gates.length < 2) return '';
  const sorted = [...gates].sort((a, b) => a.density - b.density);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const timeSaved = Math.max(0, worst.waitTimeMinutes - best.waitTimeMinutes);

  const translations = {
    en: `Gate ${worst.id} at ${Math.round(worst.density * 100)}% capacity — redirect to Gate ${best.id} (saves ~${timeSaved} min wait)`,
    es: `Puerta ${worst.id} al ${Math.round(worst.density * 100)}% de capacidad — redirigir a Puerta ${best.id} (ahorra ~${timeSaved} min de espera)`,
    fr: `Porte ${worst.id} à ${Math.round(worst.density * 100)}% de capacité — rediriger vers la Porte ${best.id} (économise ~${timeSaved} min d'attente)`,
    ar: `البوابة ${worst.id} بسعة ${Math.round(worst.density * 100)}% — إعادة التوجيه إلى البوابة ${best.id} (يوفر ~${timeSaved} دقيقة انتظار)`,
    pt: `Portão ${worst.id} com ${Math.round(worst.density * 100)}% de capacidade — redirecionar para o Portão ${best.id} (economiza ~${timeSaved} min de espera)`,
    ja: `ゲート ${worst.id} は混雑度 ${Math.round(worst.density * 100)}% です。ゲート ${best.id} へ誘導してください (待ち時間が約 ${timeSaved} 分短縮されます)`,
    hi: `गेट ${worst.id} ${Math.round(worst.density * 100)}% क्षमता पर है — गेट ${best.id} पर पुनः निर्देशित करें (लगभग ${timeSaved} मिनट का समय बचेगा)`,
  };
  return translations[language] || translations.en;
}

export function generateGateReasoningLines(gates) {
  if (!gates || gates.length < 2) return [];
  const sorted = [...gates].sort((a, b) => a.density - b.density);
  const best = sorted[0];
  return gates
    .map((gate) => {
      if (gate.id === best.id) return null;
      const saved = gate.waitTimeMinutes - best.waitTimeMinutes;
      if (saved <= 0) return null;
      return {
        gateId: gate.id,
        text: `Gate ${gate.id} ${Math.round(gate.density * 100)}% — → Gate ${best.id} saves ~${saved}min`,
      };
    })
    .filter(Boolean);
}

export function generateIncidentReasoning(incident, volunteers) {
  if (!incident || !volunteers) return '';
  const available = volunteers.filter((v) => v.currentLoad < v.maxLoad);
  if (available.length === 0) return 'All volunteers at capacity — escalate to secondary dispatch.';
  const zoneKeyword = incident.zone?.split(' ')[0]?.toLowerCase() || '';
  const scored = available.map((v) => {
    let score = v.maxLoad - v.currentLoad;
    if (v.zone?.toLowerCase().includes(zoneKeyword)) score += 10;
    const skillMap = {
      medical: 'first-aid',
      crowd: 'crowd-control',
      security: 'security',
      equipment: 'tech-support',
      facility: 'guest-services',
    };
    if (v.skills?.includes(skillMap[incident.type] || '')) score += 8;
    return { v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const bestMatch = scored[0]?.v;
  if (!bestMatch) return 'Best match: any available volunteer.';
  return `Dispatch ${bestMatch.name} (${bestMatch.zone}) — ${bestMatch.skills?.join(', ')} — load ${bestMatch.currentLoad}/${bestMatch.maxLoad}`;
}

// =========================================
// DATASET VALIDATION (Task 2 — judge data upload)
// Client-side schema validation matching mockContext.json shape.
// =========================================

export function validateDataset(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Invalid dataset: must be a JSON object.'];

  if (data.gates !== undefined) {
    if (!Array.isArray(data.gates)) errors.push('gates must be an array.');
    else
      data.gates.forEach((g, i) => {
        if (!g.id) errors.push(`gates[${i}]: missing id`);
        if (typeof g.density !== 'number' || g.density < 0 || g.density > 1)
          errors.push(`gates[${i}]: density must be 0–1`);
        if (typeof g.waitTimeMinutes !== 'number')
          errors.push(`gates[${i}]: waitTimeMinutes must be a number`);
      });
  }

  if (data.incidents !== undefined) {
    if (!Array.isArray(data.incidents)) errors.push('incidents must be an array.');
    else
      data.incidents.forEach((i, idx) => {
        if (!i.id) errors.push(`incidents[${idx}]: missing id`);
        if (!i.type) errors.push(`incidents[${idx}]: missing type`);
      });
  }

  if (data.volunteers !== undefined) {
    if (!Array.isArray(data.volunteers)) errors.push('volunteers must be an array.');
    else
      data.volunteers.forEach((v, idx) => {
        if (!v.id) errors.push(`volunteers[${idx}]: missing id`);
        if (!v.name) errors.push(`volunteers[${idx}]: missing name`);
      });
  }

  if (data.gates === undefined && data.incidents === undefined && data.volunteers === undefined) {
    errors.push('Dataset must contain at least one of: gates, incidents, volunteers.');
  }

  return errors;
}

export function parseDocumentOffline(fileText, _fileName) {
  const gates = [];
  const incidents = [];
  const volunteers = [];
  const lowercaseText = fileText.toLowerCase();

  const lines = fileText.split(/\r?\n/);
  for (const line of lines) {
    const parts = line.split(',');

    // Parse CSV Gates
    if (
      (parts[0] && parts[0].trim().toLowerCase() === 'gate') ||
      (parts.length >= 4 && parts[0].trim().length === 1 && !isNaN(parseFloat(parts[1])))
    ) {
      const isShifted = parts[0] && parts[0].trim().toLowerCase() === 'gate';
      const id = (isShifted ? parts[1] : parts[0])?.trim().toUpperCase();
      const density = parseFloat(isShifted ? parts[2] : parts[1]) || 0.5;
      const wait = parseInt(isShifted ? parts[3] : parts[2]) || 10;
      const accessibleStr = isShifted ? parts[4] : parts[3];
      const directionStr = isShifted ? parts[5] : parts[4];
      const featuresStr = isShifted ? parts[6] : parts[5];

      gates.push({
        id,
        density,
        waitTimeMinutes: wait,
        status: density > 0.85 ? 'critical' : density > 0.65 ? 'watch' : 'normal',
        accessible: accessibleStr ? accessibleStr.trim().toLowerCase() === 'true' : true,
        direction: directionStr ? directionStr.trim() : 'North',
        accessibleFeatures: featuresStr
          ? featuresStr.split(';').map((f) => f.trim())
          : ['wheelchair-ramp'],
      });
    }
    // Parse CSV Incidents
    else if (parts[0] && parts[0].trim().toUpperCase().startsWith('INC-')) {
      incidents.push({
        id: parts[0].trim().toUpperCase(),
        type: parts[1]?.trim().toLowerCase() || 'facility',
        zone: parts[2]?.trim() || 'North Stand',
        severity: parts[3]?.trim().toLowerCase() || 'medium',
        description: parts[4]?.trim() || 'Reported incident',
        status: parts[5]?.trim().toLowerCase() || 'active',
        timestamp: new Date().toISOString(),
        aiRecommendedAction: parts[6] ? parts[6].trim() : 'Deploy response crew immediately.',
      });
    }
    // Parse CSV Volunteers
    else if (
      parts[0] &&
      parts[0].trim().toUpperCase().startsWith('V') &&
      parts[0].trim().length <= 3
    ) {
      volunteers.push({
        id: parts[0].trim().toUpperCase(),
        name: parts[1]?.trim() || 'Volunteer',
        zone: parts[2]?.trim() || 'North Stand',
        languages: parts[3] ? parts[3].split(';').map((l) => l.trim()) : ['en'],
        skills: parts[4] ? parts[4].split(';').map((s) => s.trim()) : ['guest-services'],
        currentLoad: 0,
        maxLoad: 5,
        avatar: parts[1]
          ? parts[1]
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
          : 'V',
        status: 'available',
      });
    }
  }

  // Unstructured reports fallback
  if (gates.length === 0 && incidents.length === 0 && volunteers.length === 0) {
    const gateMatches = fileText.match(/gate\s+([A-F])\b.*?(\d+)%/gi);
    if (gateMatches) {
      for (const m of gateMatches) {
        const match = /gate\s+([A-F])\b.*?(\d+)%/i.exec(m);
        if (match) {
          const id = match[1].toUpperCase();
          const density = parseInt(match[2]) / 100;
          gates.push({
            id,
            density,
            waitTimeMinutes: Math.round(density * 30),
            status: density > 0.85 ? 'critical' : density > 0.65 ? 'watch' : 'normal',
            accessible: true,
            direction:
              id === 'A' || id === 'B' ? 'North' : id === 'C' || id === 'D' ? 'South' : 'East',
            accessibleFeatures: ['wheelchair-ramp'],
          });
        }
      }
    }

    if (
      lowercaseText.includes('medical') ||
      lowercaseText.includes('heat') ||
      lowercaseText.includes('injured')
    ) {
      incidents.push({
        id: `INC-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'medical',
        zone: lowercaseText.includes('south')
          ? 'South Stand'
          : lowercaseText.includes('east')
            ? 'East Wing'
            : lowercaseText.includes('west')
              ? 'West Wing'
              : 'North Stand',
        severity: 'medium',
        description: 'Report: Fan medical assistance required (extracted from report).',
        timestamp: new Date().toISOString(),
        status: 'active',
        aiRecommendedAction: 'Dispatch nearest medical volunteer. Advise cooling and hydration.',
      });
    }
    if (
      lowercaseText.includes('scanner') ||
      lowercaseText.includes('offline') ||
      lowercaseText.includes('turnstile')
    ) {
      incidents.push({
        id: `INC-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'equipment',
        zone: 'North Stand',
        severity: 'low',
        description: 'Report: Ticket scanner malfunction (extracted from report).',
        timestamp: new Date().toISOString(),
        status: 'active',
        aiRecommendedAction: 'Dispatch tech-support volunteer. Reset local turnstile controller.',
      });
    }
  }

  return { gates, incidents, volunteers };
}
