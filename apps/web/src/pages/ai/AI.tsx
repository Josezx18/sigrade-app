import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Copy,
  Download,
  Save,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  History,
  Target,
  Award,
} from 'lucide-react';
import { toast } from '../../hooks/useToast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { useGeneratePlanning, useGradeAssist, usePredictRisk } from '../../hooks/api/useAI';

const MOCK_CORRECTIONS = [
  { id: '1', studentName: 'Juan Pérez', subject: 'Matemáticas', score: 85, date: '2026-07-08', status: 'pending' },
  { id: '2', studentName: 'María García', subject: 'Lengua Española', score: 92, date: '2026-07-07', status: 'accepted' },
  { id: '3', studentName: 'Carlos López', subject: 'Matemáticas', score: 67, date: '2026-07-06', status: 'pending' },
  { id: '4', studentName: 'Ana Martínez', subject: 'Ciencias', score: 78, date: '2026-07-05', status: 'accepted' },
];

const MOCK_RUBRICS = [
  { id: '1', name: 'Exposición Oral', subject: 'Lengua Española', criteria: 4, createdAt: '2026-06-15' },
  { id: '2', name: 'Proyecto Científico', subject: 'Ciencias', criteria: 5, createdAt: '2026-06-10' },
  { id: '3', name: 'Ensayo Argumentativo', subject: 'Lengua Española', criteria: 4, createdAt: '2026-06-01' },
];

const TABS = [
  { id: 'correction', label: 'Corrección Automática', icon: CheckCircle },
  { id: 'content', label: 'Generar Contenido', icon: Sparkles },
  { id: 'rubrics', label: 'Rúbricas', icon: ClipboardList },
  { id: 'reports', label: 'Informes', icon: TrendingUp },
];

const CONTENT_TYPES = [
  { value: 'exam-questions', label: 'Preguntas de examen' },
  { value: 'full-exam', label: 'Examen completo' },
  { value: 'activities', label: 'Actividades' },
  { value: 'study-guides', label: 'Guías de estudio' },
];

const QUESTION_TYPES = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'Verdadero/Falso' },
  { value: 'open-ended', label: 'Abiertas' },
  { value: 'mix', label: 'Mixto' },
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Difícil' },
];

const COURSES = [
  { value: 'math-1', label: 'Matemáticas 1°' },
  { value: 'math-2', label: 'Matemáticas 2°' },
  { value: 'lang-1', label: 'Lengua Española 1°' },
  { value: 'lang-2', label: 'Lengua Española 2°' },
  { value: 'science-1', label: 'Ciencias 1°' },
  { value: 'science-2', label: 'Ciencias 2°' },
];

const ACTIVITY_TYPES = [
  { value: 'homework', label: 'Tarea' },
  { value: 'quiz', label: 'Prueba' },
  { value: 'project', label: 'Proyecto' },
  { value: 'exam', label: 'Examen' },
];

const PERIODS = [
  { value: '00000000-0000-0000-0000-000000000001', label: 'Período 1 - 2026' },
  { value: '00000000-0000-0000-0000-000000000002', label: 'Período 2 - 2026' },
  { value: '00000000-0000-0000-0000-000000000003', label: 'Período 3 - 2026' },
];

const REPORT_TYPES = [
  { value: 'general-performance', label: 'Rendimiento general' },
  { value: 'individual-progress', label: 'Progreso individual' },
  { value: 'risk-detection', label: 'Detección de riesgo' },
  { value: 'pedagogical-recommendations', label: 'Recomendaciones pedagógicas' },
];

const LEVELS = [
  { value: 4, label: 'Excelente' },
  { value: 3, label: 'Bueno' },
  { value: 2, label: 'Suficiente' },
  { value: 1, label: 'Insuficiente' },
];

interface CorrectionResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface Criterion {
  id: string;
  name: string;
  weight: number;
  levels: { value: number; description: string }[];
}

function CorreccionAutomatica() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [course, setCourse] = useState('');
  const [activityType, setActivityType] = useState('');
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [manualScore, setManualScore] = useState('');
  const [manualComment, setManualComment] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gradeAssist = useGradeAssist();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf')) {
      setFile(droppedFile);
    } else {
      toast({ title: 'Formato no soportado', description: 'Solo PDF e imágenes', variant: 'danger' });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type.startsWith('image/') || selected.type === 'application/pdf') {
        setFile(selected);
      } else {
        toast({ title: 'Formato no soportado', description: 'Solo PDF e imágenes', variant: 'danger' });
      }
    }
  };

  const handleCorrect = () => {
    if (!file || !course || !activityType) {
      toast({ title: 'Completa todos los campos', variant: 'warning' });
      return;
    }
    const courseLabel = COURSES.find((c) => c.value === course)?.label ?? course;
    const activityLabel = ACTIVITY_TYPES.find((a) => a.value === activityType)?.label ?? activityType;
    gradeAssist.mutate(
      {
        rubric: `Rúbrica general de ${activityLabel} (${courseLabel})`,
        studentResponse: file.name,
        maxScore: 100,
      },
      {
        onSuccess: (response) => {
          setResult({
            score: response.score,
            feedback: response.feedback,
            strengths: response.strengths ?? ['Demuestra comprensión de conceptos'],
            improvements: response.weaknesses ?? ['Profundizar en la aplicación de teoremas'],
          });
          toast({ title: 'Corrección completada', variant: 'success' });
        },
        onError: () => {
          toast({ title: 'Error en la corrección', variant: 'danger' });
        },
      }
    );
  };

  const handleAccept = () => {
    toast({ title: 'Corrección aceptada', description: 'La nota ha sido registrada', variant: 'success' });
    setResult(null);
    setFile(null);
    setManualScore('');
    setManualComment('');
    setShowOverride(false);
  };

  const handleReadjust = () => {
    if (!manualScore) {
      toast({ title: 'Ingresa una nota manual', variant: 'warning' });
      return;
    }
    setResult((prev) => prev ? { ...prev, score: Number(manualScore), feedback: manualComment || prev.feedback } : null);
    toast({ title: 'Nota reajustada', variant: 'success' });
    setShowOverride(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir Trabajo</CardTitle>
          <CardDescription>Arrastra o selecciona el trabajo del estudiante (PDF o imagen)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
              dragOver
                ? 'border-primary-500 bg-primary-50/50'
                : file
                  ? 'border-success-400 bg-success-50/30'
                  : 'border-secondary-300 bg-secondary-50/30 hover:border-primary-400 hover:bg-primary-50/20'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
                  <FileText className="h-7 w-7 text-success-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-secondary-900">{file.name}</p>
                  <p className="text-sm text-secondary-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  <XCircle className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-100">
                  <Upload className="h-7 w-7 text-secondary-500" />
                </div>
                <p className="mt-4 text-sm font-medium text-secondary-700">
                  Arrastra tu archivo aquí
                </p>
                <p className="mt-1 text-xs text-secondary-400">o haz clic para seleccionar</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                  Seleccionar archivo
                </Button>
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileSelect} />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Corrección</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">Curso / Asignatura</label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">Tipo de actividad</label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCorrect} isLoading={gradeAssist.isPending} disabled={!file || !course || !activityType}>
            <Sparkles className="h-4 w-4 mr-1" /> Corregir con IA
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultado de la Corrección</CardTitle>
              <div className="flex items-center gap-2">
                {result.score >= 80 ? (
                  <Badge variant="success">{result.score} pts</Badge>
                ) : result.score >= 60 ? (
                  <Badge variant="warning">{result.score} pts</Badge>
                ) : (
                  <Badge variant="danger">{result.score} pts</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-secondary-700 mb-2">Retroalimentación</h4>
              <p className="text-sm text-secondary-600 bg-secondary-50 rounded-lg p-4">{result.feedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-success-200 bg-success-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-success-600" />
                  <h4 className="text-sm font-semibold text-success-700">Aciertos</h4>
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-success-700">
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-success-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-warning-200 bg-warning-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-warning-600" />
                  <h4 className="text-sm font-semibold text-warning-700">Áreas de mejora</h4>
                </div>
                <ul className="space-y-2">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-warning-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {showOverride && (
              <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-4 space-y-4">
                <h4 className="text-sm font-semibold text-secondary-700">Ajuste Manual de Nota</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nueva nota (0-100)"
                    type="number"
                    min={0}
                    max={100}
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    placeholder="Ingresar nota manual"
                  />
                  <Input
                    label="Comentario del docente"
                    value={manualComment}
                    onChange={(e) => setManualComment(e.target.value)}
                    placeholder="Justificación del ajuste"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowOverride(false)}>Cancelar</Button>
                  <Button variant="primary" size="sm" onClick={handleReadjust}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Reajustar nota
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              {!showOverride && (
                <Button variant="outline" size="sm" onClick={() => setShowOverride(true)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reajustar nota
                </Button>
              )}
            </div>
            <Button variant="success" size="sm" onClick={handleAccept}>
              <CheckCircle className="h-4 w-4 mr-1" /> Aceptar corrección
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-secondary-500" />
            <CardTitle>Correcciones Recientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary-50">
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Estudiante</th>
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Asignatura</th>
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Puntaje</th>
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {MOCK_CORRECTIONS.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 font-medium text-secondary-900">{c.studentName}</td>
                    <td className="px-4 py-3 text-secondary-600">{c.subject}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.score >= 80 ? 'success' : c.score >= 60 ? 'warning' : 'danger'}>{c.score}</Badge>
                    </td>
                    <td className="px-4 py-3 text-secondary-500">{c.date}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === 'accepted' ? 'success' : 'warning'}>
                        {c.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GenerarContenido() {
  const [contentType, setContentType] = useState('');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [saved, setSaved] = useState(false);
  const generatePlanning = useGeneratePlanning();

  const handleGenerate = () => {
    if (!contentType || !topic || !grade || !questionType || !difficulty) {
      toast({ title: 'Completa todos los campos', variant: 'warning' });
      return;
    }
    setSaved(false);
    const contentTypeLabel = CONTENT_TYPES.find((c) => c.value === contentType)?.label ?? contentType;
    const questionTypeLabel = QUESTION_TYPES.find((q) => q.value === questionType)?.label ?? questionType;
    const difficultyLabel = DIFFICULTY_LEVELS.find((d) => d.value === difficulty)?.label ?? difficulty;
    const prompt =
      `Genera ${contentTypeLabel} sobre "${topic}" para ${grade}. ` +
      `Cantidad de preguntas: ${questionCount}. Tipo de preguntas: ${questionTypeLabel}. Dificultad: ${difficultyLabel}.`;
    generatePlanning.mutate(
      prompt,
      {
        onSuccess: (data) => {
          const sessionsText = data.sessions?.map(s =>
            `**Sesión ${s.sessionNumber}:** ${s.topic}\n- Actividades: ${s.activities ?? ''}\n- Tarea: ${s.homework ?? ''}`
          ).join('\n\n') ?? '';
          setGeneratedContent(
            `# ${contentTypeLabel}: ${topic}\n\n` +
            `**Título:** ${data.unitTitle}\n` +
            (data.unitNumber ? `**Unidad:** ${data.unitNumber}\n` : '') +
            `## Competencias\n${(data.competencies ?? []).map(c => `- ${c}`).join('\n')}\n\n` +
            `## Objetivos\n${(data.objectives ?? []).map(o => `- ${o}`).join('\n')}\n\n` +
            `## Contenido\n${data.content ?? ''}\n\n` +
            `## Metodología\n${data.methodology ?? ''}\n\n` +
            `## Recursos\n${(data.resources ?? []).map(r => `- ${r}`).join('\n')}\n\n` +
            `## Sesiones\n${sessionsText}`
          );
          toast({ title: 'Contenido generado exitosamente', variant: 'success' });
        },
        onError: () => {
          toast({ title: 'Error al generar contenido', variant: 'danger' });
        },
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: 'Copiado al portapapeles', variant: 'success' });
  };

  const handleExport = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Archivo exportado', variant: 'success' });
  };

  const handleSaveDraft = () => {
    setSaved(true);
    toast({ title: 'Guardado como borrador', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar Contenido Educativo</CardTitle>
          <CardDescription>Crea material didáctico personalizado con IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary-700">Tipo de contenido</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setContentType(ct.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all duration-200 ${
                    contentType === ct.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:bg-primary-50/30'
                  }`}
                >
                  {ct.value === 'exam-questions' && <FileText className="h-6 w-6" />}
                  {ct.value === 'full-exam' && <BookOpen className="h-6 w-6" />}
                  {ct.value === 'activities' && <ClipboardList className="h-6 w-6" />}
                  {ct.value === 'study-guides' && <GraduationCap className="h-6 w-6" />}
                  <span className="text-center leading-tight">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Tema / Competencia"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Ecuaciones cuadráticas"
            />
            <Input
              label="Grado / Curso"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Ej: 1° de Secundaria"
            />
            <Input
              label="Cantidad de preguntas"
              type="number"
              min={1}
              max={50}
              value={String(questionCount)}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">Tipo de pregunta</label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((qt) => (
                    <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">Dificultad</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dificultad" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((dl) => (
                    <SelectItem key={dl.value} value={dl.value}>{dl.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} isLoading={generatePlanning.isPending}>
            <Sparkles className="h-4 w-4 mr-1" /> Generar
          </Button>
        </CardFooter>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contenido Generado</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" /> Exportar
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveDraft} disabled={saved}>
                  <Save className="h-4 w-4 mr-1" /> {saved ? 'Guardado' : 'Guardar como borrador'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-secondary-50 p-6 whitespace-pre-wrap text-sm text-secondary-700 font-mono leading-relaxed">
              {generatedContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Rubricas() {
  const [rubricName, setRubricName] = useState('');
  const [rubricSubject, setRubricSubject] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', name: '', weight: 25, levels: LEVELS.map((l) => ({ value: l.value, description: '' })) },
  ]);
  const [savedRubrics] = useState(MOCK_RUBRICS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const addCriterion = () => {
    const newId = String(Date.now());
    const remainingWeight = 100 - criteria.reduce((sum, c) => sum + c.weight, 0);
    setCriteria([
      ...criteria,
      {
        id: newId,
        name: '',
        weight: Math.min(25, Math.max(0, remainingWeight)),
        levels: LEVELS.map((l) => ({ value: l.value, description: '' })),
      },
    ]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const updateCriterion = (id: string, field: 'name' | 'weight', value: string | number) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateLevel = (criterionId: string, levelValue: number, description: string) => {
    setCriteria(
      criteria.map((c) =>
        c.id === criterionId
          ? { ...c, levels: c.levels.map((l) => (l.value === levelValue ? { ...l, description } : l)) }
          : c
      )
    );
  };

  const handleGenerateAI = () => {
    if (!rubricName || !rubricSubject) {
      toast({ title: 'Completa el nombre y la asignatura', variant: 'warning' });
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCriteria(
        criteria.map((c) => ({
          ...c,
          levels: c.levels.map((l) => ({
            ...l,
            description:
              l.value === 4
                ? 'Demuestra dominio excepcional. Supera los estándares esperados.'
                : l.value === 3
                  ? 'Cumple satisfactoriamente con todos los criterios establecidos.'
                  : l.value === 2
                    ? 'Cumple parcialmente. Requiere mejoras en algunos aspectos.'
                    : 'No cumple con los criterios mínimos. Requiere intervención.',
          })),
        }))
      );
      toast({ title: 'Descripciones generadas con IA', variant: 'success' });
    }, 1500);
  };

  const handleSaveRubric = () => {
    if (!rubricName || !rubricSubject) {
      toast({ title: 'Completa todos los campos requeridos', variant: 'warning' });
      return;
    }
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      toast({ title: `La suma de pesos debe ser 100% (actual: ${totalWeight}%)`, variant: 'danger' });
      return;
    }
    toast({ title: 'Rúbrica guardada exitosamente', variant: 'success' });
    setShowCreateForm(false);
    setRubricName('');
    setRubricSubject('');
    setCriteria([
      { id: '1', name: '', weight: 25, levels: LEVELS.map((l) => ({ value: l.value, description: '' })) },
    ]);
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900">Rúbricas de Evaluación</h2>
          <p className="text-sm text-secondary-500 mt-1">Crea y gestiona rúbricas para evaluar a tus estudiantes</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-1" /> Crear Rúbrica
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Rúbrica</CardTitle>
            <CardDescription>Define los criterios y niveles de evaluación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre de la rúbrica"
                value={rubricName}
                onChange={(e) => setRubricName(e.target.value)}
                placeholder="Ej: Exposición Oral"
              />
              <Input
                label="Asignatura"
                value={rubricSubject}
                onChange={(e) => setRubricSubject(e.target.value)}
                placeholder="Ej: Lengua Española"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-secondary-700">Criterios de Evaluación</h4>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${totalWeight === 100 ? 'text-success-600' : totalWeight > 100 ? 'text-danger-600' : 'text-warning-600'}`}>
                    Peso total: {totalWeight}%
                  </span>
                  <Button variant="outline" size="sm" onClick={addCriterion}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar criterio
                  </Button>
                </div>
              </div>

              {criteria.map((criterion, ci) => (
                <div key={criterion.id} className="mb-6 rounded-lg border border-secondary-200 bg-secondary-50/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-secondary-400" />
                      <span className="text-xs font-medium text-secondary-500">Criterio {ci + 1}</span>
                    </div>
                    {criteria.length > 1 && (
                      <Button variant="ghost" size="icon-sm" onClick={() => removeCriterion(criterion.id)}>
                        <Trash2 className="h-4 w-4 text-danger-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Nombre del criterio"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                      placeholder="Ej: Contenido"
                    />
                    <Input
                      label="Peso (%)"
                      type="number"
                      min={0}
                      max={100}
                      value={String(criterion.weight)}
                      onChange={(e) => updateCriterion(criterion.id, 'weight', Number(e.target.value))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {criterion.levels.map((level) => {
                      const levelDef = LEVELS.find((l) => l.value === level.value) ?? LEVELS[0];
                      const borderColors: Record<number, string> = {
                        4: 'border-success-400',
                        3: 'border-primary-400',
                        2: 'border-warning-400',
                        1: 'border-danger-400',
                      };
                      const bgColors: Record<number, string> = {
                        4: 'bg-success-50',
                        3: 'bg-primary-50',
                        2: 'bg-warning-50',
                        1: 'bg-danger-50',
                      };
                      return (
                        <div key={level.value} className={`rounded-lg border ${borderColors[level.value]} ${bgColors[level.value]} p-3`}>
                          <label className="block text-xs font-semibold mb-1">
                            {levelDef.label} ({level.value})
                          </label>
                          <textarea
                            className="w-full rounded-md border border-secondary-200 bg-white p-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                            rows={3}
                            value={level.description}
                            onChange={(e) => updateLevel(criterion.id, level.value, e.target.value)}
                            placeholder="Descripción del nivel..."
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleGenerateAI} isLoading={isGenerating}>
              <Sparkles className="h-4 w-4 mr-1" /> Generar con IA
            </Button>
            <Button onClick={handleSaveRubric}>
              <Save className="h-4 w-4 mr-1" /> Guardar Rúbrica
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rúbricas Guardadas</CardTitle>
          <CardDescription>{savedRubrics.length} rúbricas registradas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary-50">
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Asignatura</th>
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Criterios</th>
                  <th className="px-4 py-3 text-left font-medium text-secondary-500">Fecha de creación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {savedRubrics.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 font-medium text-secondary-900">{r.name}</td>
                    <td className="px-4 py-3 text-secondary-600">{r.subject}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{r.criteria} criterios</Badge>
                    </td>
                    <td className="px-4 py-3 text-secondary-500">{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Informes() {
  const [course, setCourse] = useState('');
  const [period, setPeriod] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportContent, setReportContent] = useState('');
  const predictRisk = usePredictRisk();

  const handleGenerate = () => {
    if (!course || !period || !reportType) {
      toast({ title: 'Completa todos los campos', variant: 'warning' });
      return;
    }
    predictRisk.mutate(
      { studentId: '00000000-0000-0000-0000-000000000001', periodId: period },
      {
        onSuccess: (data) => {
          const reportLabel = REPORT_TYPES.find((r) => r.value === reportType)?.label;
          const riskText =
            `- Estudiante: Riesgo ${data.riskLevel} (${data.riskScore})\n` +
            `  Factores: ${(data.factors ?? []).join(', ')}\n` +
            `  Recomendaciones: ${(data.recommendations ?? []).join(', ')}`;

          setReportContent(
            `# Informe: ${reportLabel}\n\n` +
            `**Curso:** ${COURSES.find((c) => c.value === course)?.label}\n` +
            `**Período:** ${PERIODS.find((p) => p.value === period)?.label}\n` +
            `**Generado:** ${new Date().toLocaleDateString('es-DO')}\n\n` +
            `---\n\n` +
            `## Resultados\n\n${riskText || 'No hay datos disponibles.'}\n\n` +
            `## Recomendaciones\n\n` +
            `1. Implementar sesiones de refuerzo para estudiantes con bajo rendimiento.\n` +
            `2. Utilizar estrategias de aprendizaje colaborativo.\n` +
            `3. Realizar evaluaciones formativas más frecuentes.\n` +
            `4. Establecer canales de comunicación con padres de familia.`
          );
          toast({ title: 'Informe generado exitosamente', variant: 'success' });
        },
        onError: () => {
          toast({ title: 'Error al generar informe', variant: 'danger' });
        },
      }
    );
  };

  const handleExportPDF = () => {
    toast({ title: 'Exportando PDF...', variant: 'info' });
    setTimeout(() => toast({ title: 'PDF exportado', variant: 'success' }), 1500);
  };

  const handleExportWord = () => {
    toast({ title: 'Exportando Word...', variant: 'info' });
    setTimeout(() => toast({ title: 'Word exportado', variant: 'success' }), 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar Informe</CardTitle>
          <CardDescription>Selecciona los parámetros para generar el informe académico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">Curso</label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">Tipo de informe</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      <div className="flex items-center gap-2">
                        {rt.value === 'general-performance' && <TrendingUp className="h-4 w-4" />}
                        {rt.value === 'individual-progress' && <UserCheck className="h-4 w-4" />}
                        {rt.value === 'risk-detection' && <AlertTriangle className="h-4 w-4" />}
                        {rt.value === 'pedagogical-recommendations' && <Lightbulb className="h-4 w-4" />}
                        {rt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} isLoading={predictRisk.isPending}>
            <Sparkles className="h-4 w-4 mr-1" /> Generar Informe
          </Button>
        </CardFooter>
      </Card>

      {reportContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informe Generado</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-1" /> Exportar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportWord}>
                  <FileText className="h-4 w-4 mr-1" /> Exportar Word
                </Button>
              </div>
            </div>
            <CardDescription>Curso: {COURSES.find((c) => c.value === course)?.label} | {PERIODS.find((p) => p.value === period)?.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-white border border-secondary-200 p-6 whitespace-pre-wrap text-sm text-secondary-700 leading-relaxed">
              {reportContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AI() {
  const [activeTab, setActiveTab] = useState('correction');

  const ActiveIcon = TABS.find((t) => t.id === activeTab)?.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Inteligencia Artificial</h1>
          <p className="text-sm text-secondary-500 mt-1">
            Herramientas impulsadas por IA para potenciar tu labor docente
          </p>
        </div>
        {ActiveIcon && <ActiveIcon className="h-8 w-8 text-primary-500" />}
      </div>

      <div className="border-b border-secondary-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  isActive
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'correction' && <CorreccionAutomatica />}
        {activeTab === 'content' && <GenerarContenido />}
        {activeTab === 'rubrics' && <Rubricas />}
        {activeTab === 'reports' && <Informes />}
      </div>
    </div>
  );
}
