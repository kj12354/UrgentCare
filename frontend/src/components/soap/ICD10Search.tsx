'use client';

/**
 * ICD-10 Code Search Component
 * 
 * AI-powered search for ICD-10 diagnosis codes
 * Helps physicians find appropriate billing codes quickly
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { ICD10Code } from '@/lib/claude';

interface ICD10SearchProps {
  onSelect?: (code: ICD10Code) => void;
  selectedCodes?: ICD10Code[];
}

export default function ICD10Search({ onSelect, selectedCodes = [] }: ICD10SearchProps) {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [results, setResults] = useState<ICD10Code[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!symptoms.trim()) {
      setError('Please enter symptoms or diagnosis');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/soap/icd10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
          diagnosis: diagnosis.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search ICD-10 codes');
      }

      const data = await response.json();
      setResults(data.codes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const isCodeSelected = (code: string) => {
    return selectedCodes.some(c => c.code === code);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          ICD-10 Code Search
        </CardTitle>
        <CardDescription>
          AI-powered search for diagnosis codes based on symptoms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Symptoms (comma-separated)</label>
            <Input
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., fever, cough, sore throat"
              className="mt-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Diagnosis (optional)</label>
            <Input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g., acute bronchitis"
              className="mt-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !symptoms.trim()}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search ICD-10 Codes
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Found {results.length} suggested code{results.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((code, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono font-semibold text-blue-600">
                          {code.code}
                        </code>
                        <Badge
                          variant={
                            code.confidence === 'high'
                              ? 'default'
                              : code.confidence === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {code.confidence}
                        </Badge>
                        {isCodeSelected(code.code) && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Added
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{code.description}</p>
                    </div>
                    {onSelect && !isCodeSelected(code.code) && (
                      <Button
                        onClick={() => onSelect(code)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && !error && symptoms && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No results found. Try different symptoms or diagnosis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
