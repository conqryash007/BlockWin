'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle2, XCircle, Database, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TestSportsBetPage() {
  const { session } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in first');
      return;
    }

    setTesting(true);
    setResults(null);

    try {
      const response = await fetch('/api/sports/test-insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      setResults(data);

      if (data.success) {
        toast.success('All checks passed!');
      } else {
        toast.error(data.error || 'Diagnostics failed');
      }
    } catch (error: any) {
      setResults({ error: error.message, type: 'exception' });
      toast.error('Failed to run diagnostics');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <Card className="bg-casino-panel border-white/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-casino-brand" />
            <CardTitle>Sports Bet Database Diagnostics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>Please sign in to run diagnostics</p>
            </div>
          ) : (
            <>
              <Button
                onClick={runDiagnostics}
                disabled={testing}
                variant="casino"
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Run Diagnostics
                  </>
                )}
              </Button>

              {results && (
                <div className="space-y-4 mt-4">
                  <div className={`p-4 rounded-xl border ${
                    results.success 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <div className="flex items-start gap-3">
                      {results.success ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold mb-1">
                          {results.success ? 'All Checks Passed!' : results.error}
                        </p>
                        {results.solution && (
                          <p className="text-sm mt-2 opacity-90">{results.solution}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {results.checks && results.checks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white">Check Results:</h3>
                      {results.checks.map((check: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            check.passed
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {check.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="font-medium text-sm">{check.name}</span>
                          </div>
                          {check.error && (
                            <div className="mt-2 text-xs text-muted-foreground space-y-1">
                              <p>Error: {check.error}</p>
                              {check.code && <p>Code: {check.code}</p>}
                              {check.details && <p>Details: {JSON.stringify(check.details)}</p>}
                              {check.hint && <p>Hint: {check.hint}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {results.migrationSql && (
                    <div className="p-4 rounded-lg bg-[#0a0c10] border border-white/5">
                      <h3 className="font-semibold text-white mb-2">Migration SQL:</h3>
                      <pre className="text-xs text-muted-foreground overflow-x-auto font-mono">
                        {results.migrationSql}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          navigator.clipboard.writeText(results.migrationSql);
                          toast.success('SQL copied to clipboard!');
                        }}
                      >
                        Copy SQL
                      </Button>
                    </div>
                  )}

                  {results.insertError && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <h3 className="font-semibold text-red-400 mb-2">Insert Error Details:</h3>
                      <pre className="text-xs text-red-300 overflow-x-auto font-mono">
                        {JSON.stringify(results.insertError, null, 2)}
                      </pre>
                    </div>
                  )}

                  {results.testBetData && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h3 className="font-semibold text-blue-400 mb-2">Test Bet Data:</h3>
                      <pre className="text-xs text-blue-300 overflow-x-auto font-mono">
                        {JSON.stringify(results.testBetData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
