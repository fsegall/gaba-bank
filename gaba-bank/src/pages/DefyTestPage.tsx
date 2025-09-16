import { useState } from "react";
import { defyClient } from "../lib/defyInvestClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function DefyTestPage() {
  const [amount, setAmount] = useState<string>("100");
  const [loading, setLoading] = useState<boolean>(false);
  const [txid, setTxid] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  async function handleHealth() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await defyClient.health();
      setResult(res);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePixPing() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await defyClient.pixPing();
      setResult(res);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateIntent() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await defyClient.createPixCharge({ amount: Number(amount).toFixed(2) });
      setResult(res);
      setTxid(res?.txid || "");
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGetStatus() {
    if (!txid) return;
    setLoading(true);
    setError("");
    try {
      const res = await defyClient.getPixCharge(txid);
      setResult(res);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>defy-invest: Teste de Depósito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm mb-1">Valor</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateIntent} disabled={loading}>
                {loading ? "Criando..." : "Criar Intent"}
              </Button>
              <Button variant="secondary" onClick={handleGetStatus} disabled={loading || !txid}>
                {loading ? "Buscando..." : "Status"}
              </Button>
              <Button variant="outline" onClick={handleHealth} disabled={loading}>
                Health
              </Button>
              <Button variant="outline" onClick={handlePixPing} disabled={loading}>
                PIX Ping
              </Button>
            </div>
          </div>

          {txid && (
            <div className="text-sm text-muted-foreground">TXID: {txid}</div>
          )}

          {error && (
            <div className="text-red-600 text-sm whitespace-pre-wrap">{error}</div>
          )}

          {result && (
            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-80">
{JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DefyTestPage;


