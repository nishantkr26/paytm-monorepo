import express from "express";
import db from "@repo/db/client";

const app = express();
app.use(express.json());

app.post("/hdfcWebHook", async (req, res) => {
  const { token, userId, amount } = req.body;

  const parsedAmount = Number(amount);
  const parsedUserId = Number(userId);

  if (!token || Number.isNaN(parsedAmount) || Number.isNaN(parsedUserId)) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const [balanceResult, txnResult] = await db.$transaction([
      db.balance.updateMany({
        where: { userId: parsedUserId },
        data: {
          amount: {
            increment: parsedAmount,
          },
        },
      }),
      db.onRampTransaction.updateMany({
        where: { token },
        data: { status: "Success" },
      }),
    ]);

    console.log("Balance updated:", balanceResult.count);
    console.log("Txn updated:", txnResult.count);

    res.json({ message: "Captured" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Webhook failed" });
  }
});

app.listen(3003);
