import React, { useEffect, useState } from 'react';

// --- DATA ---
// Rebalanced stats with highly rich and modular "sevgili tribi" / relationship and career scenarios.
// Categorized by type: 'relationship' (pink/violet frame), 'industry' (emerald green frame), 'crisis' (amber/red frame)
export interface ScenarioOption {
    text: string;
    effects: Record<string, number>;
    outcome: string;
}

export interface Scenario {
    id: string;
    type: 'relationship' | 'industry' | 'crisis';
    title: string;
    desc: string;
    options: ScenarioOption[];
}

export const PRE_CONCERT_SCENARIOS: Scenario[] = [
    {
        id: 'gf_concert_jealousy',
        type: 'relationship',
        title: 'VIP KISKANÇLIK KRİZİ',
        desc: 'Konsere dakikalar kala sevgilin, sosyal medyada kulisteki kadın hayranlarla gülerken çektirdiğin fotoğrafı görmüş. "Demek benim telefonlarıma bakmama sebebin bu süslülerle takılmakmış! Sahneye çıkmadan önce bunu hallet yoksa bu ilişki biter!" diye mesaj attı.',
        options: [
            { text: 'Durumu açıklamak için canlı görüntülü ara.', effects: { rel_partner: 5, energy: -3, flow: -1 }, outcome: 'Sevgilini sakinleştirdin ama sahneye çıkmadan hemen önce nefes nefese kaldın ve ritmin bozuldu.' },
            { text: 'Telefonu uçak moduna al ve sahneye odaklan.', effects: { rel_partner: -6, energy: 2, charisma: 1 }, outcome: 'Süper konsantre sahneye çıktın fakat evde nükleer kıyamet kopmak üzere.' },
            { text: '"Onlar sadece hayran" yazıp tersle.', effects: { rel_partner: -4, energy: -1, charisma: -1 }, outcome: 'Hem sevgilinin kalbi kırıldı hem de gerginlikten soundcheck\'te berbat bir performans sergiledin.' }
        ]
    },
    {
        id: 'gf_birthday_crash',
        type: 'relationship',
        title: 'DOĞUM GÜNÜ ÇAKIŞMASI',
        desc: 'Bu geceki büyük konser, sevgilinin doğum günüyle çakıştı. Sana son mesajı: "Tüm arkadaşlarım sevgilileriyle eğleniyor, bense senin sahne süslerini bekliyorum. Ya konserin ortasında bana sahneden bir şarkı armağan edersin ya da her şeyi silerim!"',
        options: [
            { text: 'Sahneden ona özel romantik verse oku.', effects: { rel_partner: 4, flow: -1, charisma: 2 }, outcome: 'Seyirci romantik anı sevdi, sevgilin mest oldu ama underground imajın hafif zedelendi.' },
            { text: 'Onu kulise özel vip araçla getirt.', effects: { rel_partner: 3, careerCash: -300 }, outcome: 'VIP VIP takıldınız, gönlünü pahalı bir jestle aldın ama bütçe sarsıldı.' },
            { text: 'Burası sokak sahnesi, işimi karıştırma.', effects: { rel_partner: -5, charisma: 3 }, outcome: 'Sokak imajın tavan yaptı, tam bir alfa duruşu! Ancak gecenin sonunda kapıda kalacaksın.' }
        ]
    },
    {
        id: 'gf_tour_complaint',
        type: 'relationship',
        title: 'TURNEDEN BIKAN PARTNER',
        desc: '"Sürekli yollardasın, otellerde sabahlıyorsun" diye isyan eden sevgilin görüntülü aramada ağlıyor: "Ya bu turneyi burada kesip yarın benimle tatile gidersin ya da ben kendi yoluma bakarım."',
        options: [
            { text: 'Ona pahalı bir tatil paketi satın alıp gönder.', effects: { rel_partner: 3, careerCash: -400 }, outcome: 'Para her kapıyı açar. Sevgilin hediyeyle meşgul olurken sen turnede kaldın.' },
            { text: 'Aşkım her şey senin ve geleceğimiz için de.', effects: { rel_partner: 1, energy: -1 }, outcome: 'Yarım yamalak ikna oldu ama kafan yorgun düştü.' },
            { text: 'Geleceksen gel, gelmeyeceksen yol al.', effects: { rel_partner: -8, charisma: 2 }, outcome: 'Tam bir sokak serserisi tavrı. İlişki bitti ama kalbin taş gibi sertleşti.' }
        ]
    },
    {
        id: 'gf_shopping_spree',
        type: 'relationship',
        title: 'KREDİ KARTINDAN SÜRPRİZ',
        desc: 'Sevgilin senin kredi kartından çok lüks bir moda mağazasında tonla harcama yaptı. Mesajı: "Sahnede giymen için o çok havalı tasarım ceketi aldım hayatım, umarım kızmadın?"',
        options: [
            { text: 'Helal olsun, canı sağolsun de.', effects: { rel_partner: 4, careerCash: -500 }, outcome: 'İlişki tavan yaptı. Sahneye lüks ceketle çıkacaksın ama cep boşaldı.' },
            { text: 'Mağazayı arayıp harcamayı iptal ettir.', effects: { rel_partner: -6, careerCash: 50 }, outcome: 'Büyük kavga çıktı! Sevgilin rezil olduğunu söyleyip ağlıyor.' }
        ]
    },
    {
        id: 'soundcheck_fail',
        type: 'crisis',
        title: 'TEKNİK ARIZA',
        desc: 'Soundcheck sırasında mikrofon çalışmadı. Sesçi "kabloda temassızlık var" diyor ama pek güven vermiyor.',
        options: [
            { text: 'Kendi mikrofonumu kullanırım.', effects: { rel_team: 2, charisma: 1, energy: -1 }, outcome: 'Profesyonellik kazandırdı. Ekip sana saygı duyuyor.' },
            { text: 'Sesçiye bağırıp çağır.', effects: { rel_team: -3, energy: -2 }, outcome: 'Sinirlerin bozuldu, ekip sana gıcık oldu.' },
            { text: 'Boşver, playback yaparım.', effects: { rel_manager: -2, flow: -1 }, outcome: 'Kolaya kaçtın. Menajerin profesyonelliğini sorguluyor.' }
        ]
    },
    {
        id: 'backstage_fan',
        type: 'industry',
        title: 'KULİSTE ZİYARETÇİ',
        desc: 'Güvenliği aşan bir hayran kulise girdi. "Sadece bir fotoğraf!" diye bağırıyor.',
        options: [
            { text: 'Fotoğraf çekil ve imzala.', effects: { charisma: 1, energy: -1 }, outcome: 'Hayran mutluluktan ağladı. Sokakta karizman yükseliyor.' },
            { text: 'Güvenliği çağır, atın bunu!', effects: { rel_team: 1, rel_manager: 1 }, outcome: 'Menajerin güvenliği takdir etti ama biraz sert kaçtı.' },
            { text: 'Para karşılığı fotoğraf çekil.', effects: { charisma: -2, careerCash: 100 }, outcome: 'Para kazandın ama paragöz damgası yedin.' }
        ]
    },
    {
        id: 'label_pressure',
        type: 'industry',
        title: 'YAPIMCI BASKISI',
        desc: 'Menajerin aradı: "Bu geceki konserde o popüler aşk şarkısını söylemezsen sözleşmeyi yakarım!"',
        options: [
            { text: 'Tamam, söyleyeceğim.', effects: { rel_manager: 4, charisma: -2, careerCash: 250 }, outcome: 'Menajerin mutlu, para geldi ama tarzından ödün verdin.' },
            { text: 'Ben rapçiyim, pop söylemem!', effects: { rel_manager: -5, charisma: 3 }, outcome: 'Dik duruşun sana inanılmaz sokak karizması kazandırdı lakin menajerin küplere bindi.' }
        ]
    },
    {
        id: 'usb_lost',
        type: 'crisis',
        title: 'USB KAYIP',
        desc: 'DJ panik içinde yanına geldi. "Beatlerin olduğu USB\'yi evde unutmuşum abi!"',
        options: [
            { text: 'Freestyle yaparım, sorun yok.', effects: { flow: 2, energy: -2 }, outcome: 'Zorlandın ama yeteneğinle durumu kurtardın.' },
            { text: 'DJ\'i kov, telefondan çal.', effects: { rel_team: -5, careerCash: -100 }, outcome: 'Ses kalitesi berbattı, ekip moral olarak çöktü.' },
            { text: 'Acapella söyle.', effects: { lyrics: 2, charisma: 1 }, outcome: 'Cesurca bir hamle. Sözlerin daha çok dikkat çekti.' }
        ]
    },
    {
        id: 'rival_diss',
        type: 'crisis',
        title: 'RAKİP DISS',
        desc: 'Konser başlamadan hemen önce rakibin sana sahnede küfür ettiği bir video yayınladı. Telefonun susmuyor.',
        options: [
            { text: 'Sahnede ona cevap ver.', effects: { charisma: 2, rel_manager: -1 }, outcome: 'Seyirci kaosu sevdi, hype ve karizma tavan yaptı.' },
            { text: 'Umursama, işine bak.', effects: { energy: 1, rel_manager: 2 }, outcome: 'Profesyonelliğini korudun. Menajerin takdir etti.' },
            { text: 'Moralim bozuldu, konseri ertele.', effects: { energy: -3, careerCash: -500 }, outcome: 'Büyük fiyasko! Korkaklıkla suçlanıyorsun.' }
        ]
    }
];

export const POST_CONCERT_SCENARIOS: Scenario[] = [
    {
        id: 'gf_post_jealousy',
        type: 'relationship',
        title: 'DM YAKALANMASI',
        desc: 'Konserden hemen sonra sevgilin telefonunda hayranlardan gelen samimi DM mesajlarını yakaladı! "İki dakikada birileriyle flörtleşmeye ne kadar hevesliymişsin! Açıkla yoksa eşyalarımı topluyorum!"',
        options: [
            { text: 'Telefonu ona teslim et ve şifrelerini değiştirme.', effects: { rel_partner: 5, charisma: -2, energy: -2 }, outcome: 'Sadakatini kanıtladın ama özel hayatın tamamen sevgilinin kontrolü altına girdi.' },
            { text: 'Onları menajerim iş için atıyor de.', effects: { rel_partner: 1, rel_manager: -2, energy: -1 }, outcome: 'Menajerini kurban ettin. Sevgilin biraz duruldu ama menajerle aran soğudu.' },
            { text: 'Telefonum benim mahremimdir, karışamazsın.', effects: { rel_partner: -6, charisma: 2 }, outcome: 'Geri adım atmadın. Eşyalarını toplayıp gitti ama gururun kırılmadı.' }
        ]
    },
    {
        id: 'journalist_q',
        type: 'industry',
        title: 'RÖPORTAJ',
        desc: 'Magazin muhabiri mikrofonu uzattı: "Rakibiniz X hakkında ne düşünüyorsunuz? Onun sizden iyi olduğu söyleniyor."',
        options: [
            { text: 'O kim tanımıyorum.', effects: { charisma: 2, energy: 1 }, outcome: 'Efsane cevap! Swag seviyen tavan yaptı.' },
            { text: 'Herkesin tarzı farklı, saygı duyarım.', effects: { lyrics: 1, rel_manager: 1 }, outcome: 'Politik bir cevap. Menajerin takdir etti.' },
            { text: 'Mikrofonu elinden alıp fırlat.', effects: { careerCash: -100, rel_partner: -1, charisma: -1 }, outcome: 'Skandal! Tazminat ödeyeceksin ve sevgilin utandı.' }
        ]
    },
    {
        id: 'afterparty',
        type: 'relationship',
        title: 'AFTER PARTY DİLEMMASI',
        desc: 'Konser bitti, şehrin en ünlü kulübünde çılgın bir after party var. Ekip seni bekliyor fakat sevgilin evde yalnız.',
        options: [
            { text: 'Tabii ki! Bu gece dağıtıyoruz!', effects: { rel_team: 4, rel_partner: -4, careerCash: -200, energy: -3 }, outcome: 'Efsane bir geceydi, ekiple kaynaştın ama sevgilin evde kıyameti kopardı.' },
            { text: 'Hayır, sevgilimi alıp yemeğe gideceğim.', effects: { rel_partner: 5, rel_team: -1, careerCash: -150 }, outcome: 'Romantik ve sakin bir akşam. Sevgilinin tribini tamamen yok ettin!' },
            { text: 'Yalnız başıma eve gidip uyuyacağım.', effects: { energy: 3, rel_team: -1 }, outcome: 'Sıkıcı bulundun ama enerjini tazeledin.' }
        ]
    },
    {
        id: 'viral_video',
        type: 'industry',
        title: 'VİRAL VİDEO',
        desc: 'Konserde sahneden inerken düştüğün bir an internete düşmüş. Herkes dalga geçiyor.',
        options: [
            { text: 'Kendinle dalga geçip paylaş.', effects: { charisma: 2 }, outcome: 'Özgüvenin takdir topladı. Krizi fırsata çevirdin.' },
            { text: 'Videoyu kaldırtmaya çalış.', effects: { charisma: -2 }, outcome: 'Daha çok yayıldı. Komik duruma düştün.' }
        ]
    },
    {
        id: 'lost_voice',
        type: 'crisis',
        title: 'SES KISILMASI',
        desc: 'Konser sonrası sesin tamamen gitti. Konuşamıyorsun.',
        options: [
            { text: 'Doktora git.', effects: { careerCash: -150, energy: 2 }, outcome: 'İlaçlar iyi geldi, dinlenmen lazım.' },
            { text: 'Önemseme, geçer.', effects: { flow: -2 }, outcome: 'Ses tellerin zarar gördü. Bir süre flow yeteneğin düşecek.' }
        ]
    }
];

// Label Mapping
const EFFECT_LABELS: Record<string, string> = {
    rel_manager: 'Menajer',
    rel_team: 'Ekip',
    rel_fans: 'Fanlar',
    rel_partner: 'Sevgili',
    careerCash: 'Nakit',
    energy: 'Enerji',
    charisma: 'Karizma',
    flow: 'Flow',
    lyrics: 'Lirik',
    rhythm: 'Ritim'
};

interface ScenarioModalProps {
    scenario: Scenario;
    onOptionSelect: (option: ScenarioOption) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({ scenario, onOptionSelect }) => {
    // Dynamic styling based on Scenario Category
    let categoryColor = 'border-emerald-500/20 shadow-emerald-500/5 text-[#10b981]';
    let codeName = 'SYS_SECTOR // DEV_TECH';
    if (scenario.type === 'relationship') {
        categoryColor = 'border-purple-500/20 shadow-purple-500/5 text-purple-400';
        codeName = 'SYS_SECTOR // RELATIONSHIP_DRAMA';
    } else if (scenario.type === 'crisis') {
        categoryColor = 'border-red-500/20 shadow-red-500/5 text-red-400';
        codeName = 'SYS_SECTOR // CRITICAL_CRISIS';
    }

    return (
        <div className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in font-sans">
            {/* Cybernetic container card */}
            <div className={`bg-[#020204] border-2 ${categoryColor} rounded-[2rem] w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)] relative`}>
                
                {/* Micro tech background details */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                {/* Brackets around corners */}
                <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-50 ${scenario.type === 'relationship' ? 'border-purple-400' : scenario.type === 'crisis' ? 'border-red-400' : 'border-emerald-400'}`} />
                <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 opacity-50 ${scenario.type === 'relationship' ? 'border-purple-400' : scenario.type === 'crisis' ? 'border-red-400' : 'border-emerald-400'}`} />
                <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 opacity-50 ${scenario.type === 'relationship' ? 'border-purple-400' : scenario.type === 'crisis' ? 'border-red-400' : 'border-emerald-400'}`} />
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-50 ${scenario.type === 'relationship' ? 'border-purple-400' : scenario.type === 'crisis' ? 'border-red-400' : 'border-emerald-400'}`} />

                {/* Header */}
                <div className="p-6 border-b border-white/[0.04] relative">
                    <div className="text-[8px] font-mono tracking-[0.22em] mb-1 opacity-55">
                        {codeName}
                    </div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter leading-none mt-1 uppercase">
                        {scenario.title}
                    </h2>
                </div>

                {/* Body */}
                <div className="p-6 relative z-10">
                    <p className="text-neutral-300 text-xs font-semibold leading-relaxed mb-6 uppercase tracking-wide">
                        {scenario.desc}
                    </p>

                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {scenario.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => onOptionSelect(opt)}
                                className="w-full text-left p-4 bg-neutral-900/30 hover:bg-neutral-900/50 border border-white/5 hover:border-white/10 rounded-2xl transition-all active:scale-[0.98] group relative overflow-hidden"
                            >
                                <div className="text-white font-black text-xs mb-2 transition-colors duration-200 uppercase tracking-tight group-hover:text-white leading-tight">
                                    {opt.text}
                                </div>
                                
                                {/* Option effects summary badges */}
                                <div className="flex gap-2 flex-wrap">
                                    {opt.effects && Object.entries(opt.effects).map(([key, val]) => {
                                        const isPositive = Number(val) > 0;
                                        const isCash = key === 'careerCash';
                                        const label = EFFECT_LABELS[key] || key;
                                        const valDisplay = isCash 
                                            ? `₺${Math.abs(Number(val))}` 
                                            : Math.abs(Number(val));

                                        return (
                                            <span 
                                                key={key} 
                                                className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                                                    isPositive 
                                                        ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10' 
                                                        : 'bg-red-950/20 text-red-400 border border-red-500/10'
                                                }`}
                                            >
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
        <div className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center p-6 animate-fade-in font-sans" onClick={onClose}>
            {/* Minimal cyber container card */}
            <div className="bg-[#020204] border-2 border-[#10b981]/25 rounded-3xl p-8 max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                
                {/* Tech Code Watermark */}
                <div className="text-[8px] font-mono text-[#10b981]/40 tracking-[0.25em] mb-4 uppercase">PRM_SYS_STATUS // RESOLVED</div>

                {/* Subtitle */}
                <span className="text-[9px] font-black text-[#10b981] uppercase tracking-widest block mb-1">
                    OLAY SONUCU
                </span>

                {/* Title */}
                <h3 className="text-2xl font-black text-white italic tracking-tighter mb-4 uppercase">
                    RAPORLANDI
                </h3>

                {/* Main Outcome text */}
                <p className="text-neutral-300 text-xs font-bold leading-relaxed mb-8 uppercase tracking-wide">
                    {outcome}
                </p>

                {/* Continuation trigger */}
                <button 
                    onClick={onClose}
                    className="w-full py-4 rounded-xl bg-[#10b981] text-black font-black text-[11px] uppercase tracking-[0.18em] transition-all hover:bg-emerald-400 active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.25)] cursor-pointer"
                >
                    DEVAM ET &rarr;
                </button>
            </div>
        </div>
    );
};
