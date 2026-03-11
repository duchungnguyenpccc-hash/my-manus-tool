import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  projects: Array<{
    rowNumber: number;
    projectName: string;
    status: "success" | "error";
    projectId?: string;
    error?: string;
  }>;
}

export default function CSVImport() {
  const [csvContent, setCSVContent] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);

  const validateCSVMutation = trpc.csvImport.validateCSV.useMutation();
  const importProjectsMutation = trpc.csvImport.importProjects.useMutation();
  const getTemplateMutation = trpc.csvImport.getCSVTemplate.useQuery();
  const checkDuplicatesMutation = trpc.csvImport.checkDuplicates.useMutation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCSVContent(content);
      toast.success("CSV file loaded");
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (!csvContent) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsLoading(true);
    try {
      const result = await validateCSVMutation.mutateAsync({ csvContent });
      if (result.success) {
        setValidationErrors(result.errors || []);
        toast.success(`Validation complete: ${result.validRows} valid rows`);
      } else {
        toast.error(result.error || "Validation failed");
      }
    } catch (error) {
      toast.error("Validation error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckDuplicates = async () => {
    if (!csvContent) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkDuplicatesMutation.mutateAsync({ csvContent });
      if (result.hasDuplicates) {
        setDuplicates(result.duplicates);
        toast.warning(`Found ${result.duplicateCount} duplicate entries`);
      } else {
        setDuplicates([]);
        toast.success("No duplicates found");
      }
    } catch (error) {
      toast.error("Duplicate check failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!csvContent) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsLoading(true);
    try {
      const result = await importProjectsMutation.mutateAsync({
        csvContent,
        autoStart: false,
      });

      if (result.success && result.result) {
        setImportResult(result.result);
        toast.success(`${result.result.successCount} projects imported successfully`);
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (error) {
      toast.error("Import error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await getTemplateMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.template], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        a.click();
        toast.success("Template downloaded");
      }
    } catch (error) {
      toast.error("Download failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-amber-600" />
            <h1 className="text-3xl font-bold text-white">Batch CSV Import</h1>
          </div>
          <p className="text-slate-400">Import multiple projects from CSV file</p>
        </div>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            {/* Upload Section */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>Select a CSV file with your project data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-amber-500 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-slate-400 text-sm">CSV files only</p>
                  </label>
                </div>

                {csvContent && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm">✓ CSV file loaded</p>
                  </div>
                )}

                  <Button
                    onClick={handleDownloadTemplate}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-slate-800 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
              </CardContent>
            </Card>

            {/* Validation Section */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>Validation & Checks</CardTitle>
                <CardDescription>Validate and check for issues before importing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <Button
                    onClick={handleValidate}
                    disabled={!csvContent || isLoading}
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-800 gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Validate CSV
                  </Button>
                  <Button
                    onClick={handleCheckDuplicates}
                    disabled={!csvContent || isLoading}
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-800 gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Check Duplicates
                  </Button>
                </div>

                {validationErrors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-red-400 text-sm font-medium mb-2">Validation Errors:</p>
                    <div className="space-y-1">
                      {validationErrors.slice(0, 5).map((error, i) => (
                        <p key={i} className="text-red-300 text-xs">
                          Row {error.rowNumber}: {error.field} - {error.error}
                        </p>
                      ))}
                      {validationErrors.length > 5 && (
                        <p className="text-red-300 text-xs">
                          +{validationErrors.length - 5} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {duplicates.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm font-medium mb-2">Duplicates Found:</p>
                    <div className="flex flex-wrap gap-2">
                      {duplicates.map((dup) => (
                        <Badge key={dup} variant="outline" className="border-yellow-500/50">
                          {dup}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>Import Projects</CardTitle>
                <CardDescription>Create projects from validated CSV data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleImport}
                  disabled={!csvContent || isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {isLoading ? "Importing..." : "Import Projects"}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            {importResult && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-green-400">Import Complete</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm mb-1">Total Projects</p>
                      <p className="text-2xl font-bold text-white">{importResult.totalRows}</p>
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-lg">
                      <p className="text-green-400 text-sm mb-1">Successful</p>
                      <p className="text-2xl font-bold text-green-400">{importResult.successCount}</p>
                    </div>
                    <div className="bg-red-500/10 p-4 rounded-lg">
                      <p className="text-red-400 text-sm mb-1">Failed</p>
                      <p className="text-2xl font-bold text-red-400">{importResult.errorCount}</p>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400">Row</th>
                          <th className="text-left py-2 px-3 text-slate-400">Project</th>
                          <th className="text-left py-2 px-3 text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.projects.map((project) => (
                          <tr key={project.rowNumber} className="border-b border-slate-800">
                            <td className="py-2 px-3 text-slate-300">{project.rowNumber}</td>
                            <td className="py-2 px-3 text-white">{project.projectName}</td>
                            <td className="py-2 px-3">
                              <Badge
                                className={
                                  project.status === "success"
                                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                                    : "bg-red-500/10 text-red-700 border-red-500/20"
                                }
                              >
                                {project.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>Import History</CardTitle>
                <CardDescription>Previous CSV imports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      filename: "projects-batch-1.csv",
                      date: "Mar 10, 2026",
                      projects: 9,
                      success: 9,
                      failed: 0,
                    },
                    {
                      filename: "projects-batch-2.csv",
                      date: "Mar 9, 2026",
                      projects: 15,
                      success: 15,
                      failed: 0,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{item.filename}</p>
                        <p className="text-sm text-slate-400">{item.date}</p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <span className="text-slate-400">
                          {item.projects} <span className="text-slate-500">projects</span>
                        </span>
                        <span className="text-green-400">
                          {item.success} <span className="text-slate-500">success</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guide Tab */}
          <TabsContent value="guide" className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>CSV Import Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-white mb-2">Required Fields</h3>
                  <ul className="space-y-1 text-slate-400 text-sm">
                    <li>• <strong>projectName</strong> - Name of your project</li>
                    <li>• <strong>topic</strong> - Main topic for videos</li>
                    <li>• <strong>niche</strong> - Content niche (AI/Tech, Finance, Gaming, etc.)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">Optional Fields</h3>
                  <ul className="space-y-1 text-slate-400 text-sm">
                    <li>• <strong>description</strong> - Project description</li>
                    <li>• <strong>videoCount</strong> - Number of videos (1-100)</li>
                    <li>• <strong>uploadSchedule</strong> - daily, weekly, biweekly, monthly</li>
                    <li>• <strong>tags</strong> - Comma-separated tags</li>
                    <li>• <strong>monetization</strong> - adsense, sponsorship, affiliate, none</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">
                    💡 Tip: Download the template to see the correct format and example data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
