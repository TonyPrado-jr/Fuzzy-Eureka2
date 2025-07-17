export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 px-4 md:px-24">
      <div className="container mx-auto text-center">
        <p className="mb-4">&copy; {new Date().getFullYear()} EbookStark. Todos os direitos reservados.</p>
        <div className="flex justify-center space-x-6">
          <a href="/politica-privacidade" className="hover:underline">Política de Privacidade</a>
          <a href="/termos-uso" className="hover:underline">Termos de Uso</a>
        </div>
      </div>
    </footer>
  );
}
