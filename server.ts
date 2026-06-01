import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

let stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.trim()) {
    return null;
  }
  if (!stripe) {
    stripe = new Stripe(secretKey.trim());
  }
  return stripe;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Stripe Checkout Session creation
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { planName, price, successUrl, cancelUrl, trainerId, studentId, stripeSecretKey } = req.body;

      let stripeClient: Stripe | null = null;
      if (stripeSecretKey && stripeSecretKey.trim()) {
        try {
          stripeClient = new Stripe(stripeSecretKey.trim());
        } catch (initErr) {
          console.error("Invalid custom Stripe Secret Key supplied by trainer:", initErr);
        }
      }

      if (!stripeClient) {
        stripeClient = getStripe();
      }

      if (!stripeClient) {
        // Fallback for simulation when STRIPE_SECRET_KEY is not defined
        console.warn("STRIPE_SECRET_KEY environment variable is not defined and no custom key provided. Initiating sandbox simulation.");
        return res.json({
          isSimulation: true,
          message: "Modo Simulação (Sem Chave Secreta do Stripe configurada)"
        });
      }

      // Convert price to cents (Stripe works with integers in cents/cents-equivalent)
      const parsedPrice = typeof price === "number" ? price : parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error("Invalid price specified.");
      }
      const amountInCents = Math.round(parsedPrice * 100);

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `GymPulse - Plano ${planName}`,
                description: `Mensalidade da Consultoria Esportiva`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          trainerId: trainerId || "",
          studentId: studentId || "",
          planName: planName,
        },
      });

      return res.json({ sessionUrl: session.url, isSimulation: false });
    } catch (error: any) {
      console.error("Error creating Stripe checkout session:", error);
      const errMsg = error.message || "";
      const isKeyError = errMsg.includes("API key") || 
                         errMsg.includes("apiKey") || 
                         errMsg.includes("authentication") || 
                         errMsg.includes("key provided") || 
                         errMsg.includes("test key") || 
                         errMsg.includes("restricted") || 
                         errMsg.includes("Expired");
      
      if (isKeyError) {
        console.warn("Stripe key validation failed. Falling back to secure sandbox simulation session.");
        return res.json({ 
          isSimulation: true, 
          message: "A chave secreta do Stripe está expirada ou inválida. Mudando automaticamente para modo de simulação seguro para teste de fluxo.",
          error: errMsg
        });
      }
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
