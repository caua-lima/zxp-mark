import { redirect } from "next/navigation";

/** A lista de "temas" saiu: tudo se cria como marco, e os assuntos são categorias no formulário. */
export default function PaginaTemas() {
  redirect("/marcos");
}
