export async function sendWhatsAppMessage(target: string, message: string) {
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (!fonnteToken) {
    console.error("FONNTE_TOKEN is not configured");
    return false;
  }

  // Normalize number
  let num = target.replace(/\D/g, "");
  if (num.startsWith("0")) {
    num = "62" + num.substring(1);
  } else if (!num.startsWith("62")) {
    num = "62" + num;
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": fonnteToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target: num,
        message: message
      })
    });

    const result = await response.json();
    return response.ok && result.status;
  } catch (error) {
    console.error("WhatsApp Send Error:", error);
    return false;
  }
}

export async function broadcastWhatsAppMessage(targets: string[], message: string) {
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (!fonnteToken) {
    console.error("FONNTE_TOKEN is not configured");
    return false;
  }

  const normalizedTargets = targets.map(target => {
    let num = target.replace(/\D/g, "");
    if (num.startsWith("0")) {
      num = "62" + num.substring(1);
    } else if (!num.startsWith("62")) {
      num = "62" + num;
    }
    return num;
  }).filter(Boolean);

  if (normalizedTargets.length === 0) return false;

  // Fonnte accepts comma separated targets
  const targetString = normalizedTargets.join(",");

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": fonnteToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target: targetString,
        message: message
      })
    });

    const result = await response.json();
    return response.ok && result.status;
  } catch (error) {
    console.error("WhatsApp Broadcast Error:", error);
    return false;
  }
}
