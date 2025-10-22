# Script de déploiement automatique sur NAS
# Usage: .\deploy-to-nas.ps1 -NasIP "192.168.1.100" -NasUser "admin"

param(
    [Parameter(Mandatory=$true)]
    [string]$NasIP,
    
    [Parameter(Mandatory=$false)]
    [string]$NasUser = "admin",
    
    [Parameter(Mandatory=$false)]
    [string]$NasPath = "/volume1/docker/cinema-brest"
)

Write-Host "🚀 Déploiement de CinéBrest sur NAS" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host "NAS: $NasUser@$NasIP" -ForegroundColor Yellow
Write-Host "Destination: $NasPath" -ForegroundColor Yellow
Write-Host ""

# Vérifier que .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Le fichier .env n'existe pas!" -ForegroundColor Yellow
    Write-Host "Créez-le à partir de .env.example et ajoutez votre JAWG_API_KEY" -ForegroundColor Yellow
    $continue = Read-Host "Continuer quand même? (o/N)"
    if ($continue -ne "o") {
        exit 1
    }
}

# Liste des fichiers à transférer
$files = @(
    "app.py",
    "requirements.txt",
    "Dockerfile",
    "docker-compose.yml",
    ".dockerignore",
    ".env",
    "clear_db.py",
    "db_stats.py",
    "modules/",
    "static/",
    "templates/",
    "data/.gitkeep"
)

Write-Host "1️⃣ Création du dossier sur le NAS..." -ForegroundColor Yellow
ssh "$NasUser@$NasIP" "mkdir -p $NasPath/modules $NasPath/static $NasPath/templates $NasPath/data"

Write-Host "`n2️⃣ Transfert des fichiers..." -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  → $file" -ForegroundColor Gray
        if ($file.EndsWith("/")) {
            scp -r $file "$NasUser@${NasIP}:$NasPath/"
        } else {
            scp $file "$NasUser@${NasIP}:$NasPath/$file"
        }
    }
}

Write-Host "`n3️⃣ Lancement de l'application..." -ForegroundColor Yellow
ssh "$NasUser@$NasIP" "cd $NasPath && docker-compose down && docker-compose build && docker-compose up -d"

Write-Host "`n✅ Déploiement terminé!" -ForegroundColor Green
Write-Host "`nL'application devrait être accessible sur:" -ForegroundColor Cyan
Write-Host "  http://${NasIP}:5000" -ForegroundColor White
Write-Host "`nPour voir les logs:" -ForegroundColor Cyan
Write-Host "  ssh $NasUser@$NasIP 'cd $NasPath && docker-compose logs -f'" -ForegroundColor White
