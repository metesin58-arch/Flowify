
export const handler = async (event, context) => {
  // Frontend'den gelen parametreleri al
  const { term, limit = '25' } = event.queryStringParameters;

  if (!term) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Arama terimi (term) gereklidir.' }),
    };
  }

  // iTunes API URL'ini oluştur
  // Sunucu tarafında istek attığımız için CORS sorunu yaşanmaz.
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}&country=TR&lang=tr_tr`;

  try {
    const response = await fetch(itunesUrl);
    
    if (!response.ok) {
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: `iTunes API hatası: ${response.status}` })
        };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // İsteğe bağlı: Farklı domainlerden erişim gerekirse açılabilir
        'Access-Control-Allow-Origin': '*', 
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Proxy Hatası:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sunucu hatası', details: error.message }),
    };
  }
};
