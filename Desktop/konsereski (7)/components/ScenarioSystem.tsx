
import React from 'react';
import { TrophyIcon, CoinIcon } from './Icons';

// --- DATA ---
// VALUES REBALANCED: Low impact stats (+/- 1-5), Low impact cash (+/- 50-500)

export const PRE_CONCERT_SCENARIOS = [
    {
        id: 'soundcheck_fail',
        title: 'TEKNİK ARIZA',
        desc: 'Soundcheck sırasında mikrofon çalışmadı. Sesçi "kabloda temassızlık var" diyor ama pek güven vermiyor.',
        options: [
            { text: 'Kendi mikrofonumu kullanırım.', effects: { rel_team: 2, charisma: 1, energy: -1 }, outcome: 'Profesyonellik kazandırdı. Ekip sana saygı duyuyor.' },
            { text: 'Sesçiye bağırıp çağır.', effects: { rel_team: -3, energy: -2 }, outcome: 'Sinirlerin bozuldu, ekip sana gıcık oldu.' },
            { text: 'Boşver, playback yaparım.', effects: { rel_fans: -3, rel_manager: -1 }, outcome: 'Kolaya kaçtın. Fanlar bunu fark edecek.' }
        ]
    },
    {
        id: 'backstage_fan',
        title: 'KULİSTE ZİYARETÇİ',
        desc: 'Güvenliği aşan bir hayran kulise girdi. "Sadece bir fotoğraf!" diye bağırıyor.',
        options: [
            { text: 'Fotoğraf çekil ve imzala.', effects: { rel_fans: 3, energy: -1 }, outcome: 'Hayran mutluluktan ağladı. Fan kitlen seni seviyor.' },
            { text: 'Güvenliği çağır, atın bunu!', effects: { rel_fans: -2, rel_manager: 1 }, outcome: 'Menajerin güvenliği takdir etti ama fanlar üzgün.' },
            { text: 'Para karşılığı fotoğraf çekil.', effects: { rel_fans: -5, careerCash: 100 }, outcome: 'Para kazandın ama paragöz damgası yedin.' }
        ]
    },
    {
        id: 'label_pressure',
        title: 'YAPIMCI BASKISI',
        desc: 'Menajerin aradı: "Bu geceki konserde o popüler aşk şarkısını söylemezsen sözleşmeyi yakarım!"',
        options: [
            { text: 'Tamam, söyleyeceğim.', effects: { rel_manager: 4, charisma: -2, careerCash: 250 }, outcome: 'Menajerin mutlu, para geldi ama tarzından ödün verdin.' },
            { text: 'Ben rapçiyim, pop söylemem!', effects: { rel_manager: -5, rel_fans: 2, careerCash: -50 }, outcome: 'Dik duruşun fanları coşturdu ama menajerin küplere bindi.' }
        ]
    },
    {
        id: 'gf_drama',
        title: 'SEVGİLİ TRİBİ',
        desc: 'Konsere dakikalar kala sevgilin mesaj attı: "Yine mi konser? Benimle hiç ilgilenmiyorsun!"',
        options: [
            { text: 'Arayıp gönlünü al.', effects: { rel_partner: 3, energy: -2, flow: -1 }, outcome: 'İlişkini kurtardın ama konsere yorgun ve konsantrasyonun bozuk çıkıyorsun.' },
            { text: 'Şu an işim var, sonra konuşuruz.', effects: { rel_partner: -4, energy: 1 }, outcome: 'Kafan rahat sahneye çıktın ama evde kavga var.' }
        ]
    },
    {
        id: 'usb_lost',
        title: 'USB KAYIP',
        desc: 'DJ panik içinde yanına geldi. "Beatlerin olduğu USB\'yi evde unutmuşum abi!"',
        options: [
            { text: 'Freestyle yaparım, sorun yok.', effects: { flow: 2, energy: -2, rel_fans: 1 }, outcome: 'Zorlandın ama yeteneğinle durumu kurtardın.' },
            { text: 'DJ\'i kov, telefondan çal.', effects: { rel_team: -5, careerCash: -100 }, outcome: 'Ses kalitesi berbattı, ekip moral olarak çöktü.' },
            { text: 'Acapella söyle.', effects: { lyrics: 2, charisma: 1 }, outcome: 'Cesurca bir hamle. Sözlerin daha çok dikkat çekti.' }
        ]
    },
    {
        id: 'rival_diss',
        title: 'RAKİP DISS',
        desc: 'Konser başlamadan hemen önce rakibin sana sahnede küfür ettiği bir video yayınladı. Telefonun susmuyor.',
        options: [
            { text: 'Sahnede ona cevap ver.', effects: { rel_fans: 3, charisma: 1, rel_manager: -1 }, outcome: 'Seyirci kaosu sevdi, hype tavan yaptı.' },
            { text: 'Umursama, işine bak.', effects: { energy: 1, rel_manager: 2 }, outcome: 'Profesyonelliğini korudun. Menajerin takdir etti.' },
            { text: 'Moralim bozuldu, konseri ertele.', effects: { rel_fans: -10, careerCash: -500 }, outcome: 'Büyük fiyasko! Fanlar seni korkaklıkla suçluyor.' }
        ]
    },
    {
        id: 'vip_guest',
        title: 'VIP LOCA',
        desc: 'Şehrin en zengin iş adamı kulise geldi. "Özel bir şarkı istersen sana sponsor olurum" diyor.',
        options: [
            { text: 'Kabul et.', effects: { careerCash: 1000, rel_fans: -3 }, outcome: 'Cebin para gördü ama "satılmış" damgası yedin.' },
            { text: 'Reddet, ben halkın sanatçısıyım.', effects: { rel_fans: 4, charisma: 2 }, outcome: 'Respect kazandın. Sokak seni konuşuyor.' }
        ]
    },
    {
        id: 'throat_pain',
        title: 'SES TELİ',
        desc: 'Boğazında hafif bir yanma var. Sesin çatallanıyor.',
        options: [
            { text: 'Bitki çayı iç, zorlama.', effects: { flow: -2, energy: 1 }, outcome: 'Performansın düşüktü ama sesini korudun.' },
            { text: 'Viski iç, ses açılsın.', effects: { charisma: 2, health: -2, energy: -1 }, outcome: 'Sahnede devleştin ama yarın konuşamayacaksın.' },
            { text: 'Autotune\'u fulleyin.', effects: { rel_fans: -2, flow: 1 }, outcome: 'Robot gibiydin ama en azından detone olmadın.' }
        ]
    },
    {
        id: 'costume_rip',
        title: 'KIYAFET KAZASI',
        desc: 'Sahneye çıkarken pantolonun bir yere takılıp yırtıldı!',
        options: [
            { text: 'Böyle çık, bu yeni moda de.', effects: { charisma: 3, rel_fans: 1 }, outcome: 'Herkes inandı! Yeni bir akım başlattın.' },
            { text: 'Yedek eşofmanları giy.', effects: { charisma: -2 }, outcome: 'Tarzın bozuldu ama rezil olmadın.' },
            { text: 'Beni dikmeleri için beklet.', effects: { hype: -10, rel_manager: -2 }, outcome: 'Seyirci beklemekten sıkıldı.' }
        ]
    },
    {
        id: 'police_check',
        title: 'POLİS KONTROLÜ',
        desc: 'Kulisi polisler bastı. Rutin arama yapıyorlar ama bu seni geriyor.',
        options: [
            { text: 'Sakin kal, işbirlikçi ol.', effects: { energy: -1 }, outcome: 'Temiz çıktın ama modun düştü.' },
            { text: 'Ters yap, burası benim alanım!', effects: { charisma: 2, careerCash: -200 }, outcome: 'Fanlar videoya çekti, viral oldun ama ceza yedin.' }
        ]
    },
    {
        id: 'ex_lover',
        title: 'ESKİ SEVGİLİ',
        desc: 'Eski sevgilini en önde, sana kötü kötü bakarken gördün.',
        options: [
            { text: 'Ona bakarak hüzünlü şarkı söyle.', effects: { lyrics: 2, rel_fans: 2, energy: -2 }, outcome: 'Duygusal anlar yaşandı, herkes ağladı.' },
            { text: 'Görmezden gel, eğlenmene bak.', effects: { energy: 1, flow: 1 }, outcome: 'Umurunda değilmiş gibi yaptın, sahne aktı.' },
            { text: 'Güvenliğe söyle dışarı atsınlar.', effects: { rel_fans: -3, charisma: -2 }, outcome: 'Kaba hareket. Seyirci yuhaladı.' }
        ]
    },
    {
        id: 'bad_acoustics',
        title: 'KÖTÜ AKUSTİK',
        desc: 'Mekanın akustiği berbat, ses boğuk geliyor.',
        options: [
            { text: 'Daha yüksek sesle bağır.', effects: { energy: -3, charisma: 2 }, outcome: 'Sesin kısıldı ama enerjin mekanı doldurdu.' },
            { text: 'Slow şarkılara ağırlık ver.', effects: { hype: -5, flow: 1 }, outcome: 'Sıkıcı bir konser oldu ama ses anlaşıldı.' }
        ]
    },
    {
        id: 'opening_act',
        title: 'ÖN GRUP',
        desc: 'Senden önce çıkan grup seyirciyi çok fena coşturdu. Beklenti yüksek.',
        options: [
            { text: 'Onlardan daha iyi olduğumu göster.', effects: { energy: -2, flow: 2, charisma: 1 }, outcome: 'Rekabet seni gaza getirdi, efsanevi bir giriş yaptın.' },
            { text: 'Onları sahneye geri çağır, düet yap.', effects: { rel_fans: 3, rel_team: 2 }, outcome: 'Birlikten kuvvet doğdu, gece unutulmaz oldu.' }
        ]
    },
    {
        id: 'forgot_lyrics',
        title: 'SÖZLERİ UNUTTUN',
        desc: 'Sahneye çıkmadan hemen önce kafan boşaldı. İlk şarkının sözleri aklına gelmiyor.',
        options: [
            { text: 'Telefondan bak.', effects: { charisma: -3, lyrics: -1 }, outcome: 'Amatörce göründü.' },
            { text: 'Doğaçlama gir.', effects: { flow: 2, lyrics: 1, energy: -1 }, outcome: 'Riskliydi ama tuttu. Kimse anlamadı.' }
        ]
    },
    {
        id: 'rain_outdoor',
        title: 'YAĞMUR BAŞLADI',
        desc: 'Açık hava konseri ve sağanak yağmur başladı.',
        options: [
            { text: 'Yağmurda devam! Islanalım!', effects: { rel_fans: 5, health: -3 }, outcome: 'Efsanevi bir an oldu ama hasta olacaksın.' },
            { text: 'Konseri iptal et.', effects: { rel_fans: -5, careerCash: -50 }, outcome: 'Güvenli ama hayal kırıklığı.' }
        ]
    }
];

export const POST_CONCERT_SCENARIOS = [
    {
        id: 'journalist_q',
        title: 'RÖPORTAJ',
        desc: 'Magazin muhabiri mikrofonu uzattı: "Rakibiniz X hakkında ne düşünüyorsunuz? Onun sizden iyi olduğu söyleniyor."',
        options: [
            { text: 'O kim tanımıyorum.', effects: { charisma: 2, rel_fans: 1 }, outcome: 'Efsane cevap! Swag seviyen arttı.' },
            { text: 'Herkesin tarzı farklı, saygı duyarım.', effects: { lyrics: 1, rel_manager: 1 }, outcome: 'Politik bir cevap. Lirik zekan takdir edildi.' },
            { text: 'Mikrofonu elinden alıp fırlat.', effects: { rel_fans: -2, careerCash: -100, rel_partner: -1 }, outcome: 'Skandal! Tazminat ödeyeceksin ve sevgilin utandı.' }
        ]
    },
    {
        id: 'afterparty',
        title: 'AFTER PARTY',
        desc: 'Konser bitti, şehrin en ünlü kulübünde after party var. Ekip seni bekliyor.',
        options: [
            { text: 'Tabii ki! Bu gece dağıtıyoruz!', effects: { rel_team: 4, rel_partner: -2, careerCash: -200, energy: -4 }, outcome: 'Efsane bir geceydi, ekiple kaynaştın ama cüzdan boşaldı ve bittin.' },
            { text: 'Hayır, eve gidip uyuyacağım.', effects: { rel_team: -2, energy: 2 }, outcome: 'Sıkıcı bulundun ama dinç uyandın.' },
            { text: 'Sevgilimi alıp yemeğe gideceğim.', effects: { rel_partner: 4, rel_team: -1, careerCash: -100 }, outcome: 'Romantik bir akşam. İlişkin düzeldi.' }
        ]
    },
    {
        id: 'viral_video',
        title: 'VİRAL VİDEO',
        desc: 'Konserde düştüğün bir an internete düşmüş. Herkes dalga geçiyor.',
        options: [
            { text: 'Kendinle dalga geçip paylaş.', effects: { rel_fans: 3, charisma: 1 }, outcome: 'Özgüvenin takdir topladı. Krizi fırsata çevirdin.' },
            { text: 'Videoyu kaldırtmaya çalış.', effects: { rel_fans: -2, charisma: -1 }, outcome: 'Daha çok yayıldı. "Streisand etkisi" yaşadın.' }
        ]
    },
    {
        id: 'lost_voice',
        title: 'SES KISILMASI',
        desc: 'Konser sonrası sesin tamamen gitti. Konuşamıyorsun.',
        options: [
            { text: 'Doktora git.', effects: { careerCash: -150, energy: 2 }, outcome: 'İlaçlar iyi geldi, dinlenmen lazım.' },
            { text: 'Önemseme, geçer.', effects: { flow: -2 }, outcome: 'Ses tellerin zarar gördü. Bir süre flow yeteneğin düşecek.' }
        ]
    },
    {
        id: 'fan_gift',
        title: 'HAYRAN HEDİYESİ',
        desc: 'Bir hayran çıkışta sana el yapımı bir portreni hediye etti.',
        options: [
            { text: 'Teşekkür edip çöpe at.', effects: { rel_fans: -5 }, outcome: 'Biri bunu görüp videoya çekti. Linç yiyorsun.' },
            { text: 'Eve götürüp as.', effects: { rel_fans: 2, energy: 1 }, outcome: 'Hikayende paylaştın, fanlar mest oldu.' }
        ]
    },
    {
        id: 'collab_offer',
        title: 'DÜET TEKLİFİ',
        desc: 'Sektörden yeni yetme bir rapçi düet yapmak için yalvarıyor.',
        options: [
            { text: 'Kabul et, gence destek ol.', effects: { rel_fans: 2, careerCash: -50 }, outcome: 'Abi rolünü üstlendin. Saygınlık kazandın.' },
            { text: 'Para verirse olur.', effects: { careerCash: 500, rel_fans: -1 }, outcome: 'Parayı aldın ama "paragöz" dediler.' },
            { text: 'Reddet.', effects: { charisma: 1 }, outcome: 'Seviyemi korurum dedin.' }
        ]
    },
    {
        id: 'hotel_room',
        title: 'OTEL ODASI',
        desc: 'Otel odasında parti yaparken eşyalar kırıldı.',
        options: [
            { text: 'Ödeyip kapat konuyu.', effects: { careerCash: -300, charisma: 1 }, outcome: 'Rockstar hayatı pahalıdır.' },
            { text: 'Kaç!', effects: { rel_manager: -3, rel_fans: -2 }, outcome: 'Otel yönetimi basına sızdırdı. Rezillik.' }
        ]
    },
    {
        id: 'sponsor_bonus',
        title: 'SPONSOR PRİMİ',
        desc: 'Sponsor firma performansı çok beğendi, ekstra ödeme yapmak istiyor.',
        options: [
            { text: 'Parayı al.', effects: { careerCash: 400 }, outcome: 'Kasa doldu.' },
            { text: 'Parayı ekibe dağıt.', effects: { rel_team: 5, charisma: 2 }, outcome: 'Ekibin senin için kurşun atar kurşun yer artık.' }
        ]
    },
    {
        id: 'street_fight',
        title: 'SOKAK KAVGASI',
        desc: 'Çıkışta sana laf atan bir grup serseri var.',
        options: [
            { text: 'Kavgaya gir.', effects: { health: -2, charisma: 2, energy: -3 }, outcome: 'Gözün morardı ama geri vites yapmadın.' },
            { text: 'Arabaya binip git.', effects: { energy: 1 }, outcome: 'Akıllıca seçim. Zarar görmedin.' }
        ]
    },
    {
        id: 'inspiration',
        title: 'İLHAM GELDİ',
        desc: 'Adrenalin yüzünden uyuyamıyorsun, aklına harika sözler geliyor.',
        options: [
            { text: 'Hemen yaz.', effects: { lyrics: 3, energy: -2 }, outcome: 'Sabahladın ama efsane bir verse yazdın.' },
            { text: 'Uyu, yarın yazarsın.', effects: { energy: 2 }, outcome: 'Dinlendin ama sözleri unuttun.' }
        ]
    },
    {
        id: 'charity',
        title: 'YARDIM KONSERİ',
        desc: 'Bir dernek, gelirini bağışlaman için seni arıyor.',
        options: [
            { text: 'Geliri bağışla.', effects: { careerCash: -200, rel_fans: 5, respect: 2 }, outcome: 'Paradan oldun ama kalpleri kazandın.' },
            { text: 'Benim de paraya ihtiyacım var.', effects: { careerCash: 200, rel_fans: -1 }, outcome: 'Parayı cebine attın.' }
        ]
    },
    {
        id: 'manager_meeting',
        title: 'MENAJER TOPLANTISI',
        desc: 'Menajerin performansı değerlendirmek istiyor.',
        options: [
            { text: 'Dinle ve not al.', effects: { rel_manager: 3, flow: 1 }, outcome: 'Hatalarından ders çıkardın.' },
            { text: 'Ben oldum artık, sen kimsin?', effects: { rel_manager: -4, charisma: 1 }, outcome: 'Egon tavan yaptı, menajer bozuldu.' }
        ]
    }
];

// --- COMPONENTS ---

// Label Mapping
const EFFECT_LABELS: Record<string, string> = {
    rel_manager: 'Menajer',
    rel_team: 'Ekip',
    rel_fans: 'Fanlar',
    rel_partner: 'Aşk',
    careerCash: 'Nakit',
    energy: 'Enerji',
    charisma: 'Karizma',
    flow: 'Flow',
    lyrics: 'Lirik',
    rhythm: 'Ritim'
};

interface ScenarioModalProps {
    scenario: typeof PRE_CONCERT_SCENARIOS[0];
    onOptionSelect: (option: any) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({ scenario, onOptionSelect }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#111] border-2 border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900 to-[#111] p-6 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-6xl">📰</span>
                    </div>
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">SON DAKİKA</div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter leading-none">{scenario.title}</h2>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-neutral-300 text-sm font-medium leading-relaxed mb-8">
                        {scenario.desc}
                    </p>

                    <div className="space-y-3">
                        {scenario.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => onOptionSelect(opt)}
                                className="w-full text-left p-4 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 rounded-xl transition-all active:scale-[0.98] group"
                            >
                                <div className="text-white font-bold text-xs mb-1 group-hover:text-purple-400 transition-colors">
                                    {opt.text}
                                </div>
                                {/* PREVIEW EFFECTS (UPDATED) */}
                                <div className="flex gap-2 flex-wrap">
                                    {opt.effects && Object.entries(opt.effects).map(([key, val]) => {
                                        const isPositive = Number(val) > 0;
                                        const isCash = key === 'careerCash';
                                        const label = EFFECT_LABELS[key] || key;
                                        const valDisplay = isCash 
                                            ? `₺${Math.abs(Number(val))}` 
                                            : Math.abs(Number(val));

                                        return (
                                            <span key={key} className={`text-[9px] font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : '-'}{valDisplay} {isCash ? '' : label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ScenarioResultModal: React.FC<{ outcome: string, onClose: () => void }> = ({ outcome, onClose }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
            <div className="bg-[#111] border border-green-500/30 rounded-2xl p-8 max-w-sm text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-white mb-2">SONUÇ</h3>
                <p className="text-neutral-400 text-sm mb-6">{outcome}</p>
                <button className="text-green-500 font-bold text-xs uppercase tracking-widest animate-pulse">Devam Et &rarr;</button>
            </div>
        </div>
    );
};
