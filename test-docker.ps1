# Script de test Docker pour Windows
# Teste la construction de l'image Docker localement

Write-Host "🐳 Test de construction Docker pour CinéBrest" -ForegroundColor Cyan
Write-Host "=" * 60

# Vérifier que Docker est installé
Write-Host "`n1️⃣ Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker trouvé: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Construire l'image
Write-Host "`n2️⃣ Construction de l'image Docker..." -ForegroundColor Yellow
docker build -t cinema-brest-test .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Image construite avec succès!" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la construction" -ForegroundColor Red
    exit 1
}

# Afficher la taille de l'image
Write-Host "`n3️⃣ Informations sur l'image:" -ForegroundColor Yellow
docker images cinema-brest-test

Write-Host "`n✅ Test réussi! Vous pouvez maintenant déployer sur votre NAS." -ForegroundColor Green
Write-Host "`nPour tester localement, lancez:" -ForegroundColor Cyan
Write-Host "  docker-compose up" -ForegroundColor White
Write-Host "`nPour nettoyer l'image de test:" -ForegroundColor Cyan
Write-Host "  docker rmi cinema-brest-test" -ForegroundColor White
