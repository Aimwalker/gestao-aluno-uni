import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import StudentTable from "@/components/StudentTable";
import StudentDialog from "@/components/StudentDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  nome_completo: string;
  matricula: string;
  email: string;
  curso: string;
}

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("nome_completo", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar alunos", {
        description: error.message,
      });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleSaveStudent = async (student: Student) => {
    try {
      if (student.id) {
        const { error } = await supabase
          .from("alunos")
          .update({
            nome_completo: student.nome_completo,
            matricula: student.matricula,
            email: student.email,
            curso: student.curso,
          })
          .eq("id", student.id);

        if (error) throw error;
        toast.success("Aluno atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("alunos")
          .insert({
            nome_completo: student.nome_completo,
            matricula: student.matricula,
            email: student.email,
            curso: student.curso,
          });

        if (error) throw error;
        toast.success("Aluno criado com sucesso!");
      }

      fetchStudents();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("alunos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Aluno excluído com sucesso!");
      fetchStudents();
    } catch (error: any) {
      toast.error("Erro ao excluir aluno", {
        description: error.message,
      });
    }
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStudent(null);
    setIsDialogOpen(true);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-6 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Alunos</h1>
              <p className="text-muted-foreground mt-1">
                {isAdmin ? "Gerencie todos os alunos do sistema" : "Visualize os alunos cadastrados"}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={handleAddNew} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Novo Aluno
              </Button>
            )}
          </div>

          {isLoadingStudents ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando alunos...</p>
            </div>
          ) : (
            <StudentTable
              students={students}
              onEdit={handleEdit}
              onDelete={handleDeleteStudent}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </main>

      <StudentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        student={selectedStudent}
        onSave={handleSaveStudent}
      />
    </div>
  );
};

export default Index;
