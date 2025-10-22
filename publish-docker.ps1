# Script de publication sur Docker Hub
# Usage: .\publish-docker.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$DockerUsername = "balaiduckman2",
    
    [Parameter(Mandatory=$false)]
    [string]$ImageName = "cinema-brest",
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

$FullImageName = "${DockerUsername}/${ImageName}:${Tag}"

Write-Host "Publication de l'image Docker sur Docker Hub" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host "Image: $FullImageName" -ForegroundColor Yellow
Write-Host ""

# Verifier que Docker est installe
Write-Host "1. Verification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker trouve: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker n'est pas installe" -ForegroundColor Red
    exit 1
}

# Verifier que l'utilisateur est connecte
Write-Host ""
Write-Host "2. Verification de la connexion Docker Hub..." -ForegroundColor Yellow
$dockerInfo = docker info 2>&1 | Select-String "Username"
if ($dockerInfo) {
    Write-Host "Connecte a Docker Hub" -ForegroundColor Green
} else {
    Write-Host "Non connecte a Docker Hub" -ForegroundColor Yellow
    Write-Host "Connexion en cours..." -ForegroundColor Yellow
    docker login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Echec de la connexion" -ForegroundColor Red
        exit 1
    }
}

# Construire l'image
Write-Host ""
Write-Host "3. Construction de l'image..." -ForegroundColor Yellow
docker build -t $FullImageName .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Echec de la construction" -ForegroundColor Red
    exit 1
}
Write-Host "Image construite avec succes" -ForegroundColor Green

# Afficher la taille
Write-Host ""
Write-Host "4. Informations sur l'image:" -ForegroundColor Yellow
docker images $FullImageName

# Tester l'image localement (optionnel)
Write-Host ""
Write-Host "5. Test de l'image localement..." -ForegroundColor Yellow
$testContainer = "cinema-brest-test"

# Arrêter et supprimer un éventuel conteneur de test existant
docker stop $testContainer 2>$null
docker rm $testContainer 2>$null

Write-Host "Lancement du conteneur de test..." -ForegroundColor Gray
docker run -d --name $testContainer -p 5001:5000 -e JAWG_API_KEY=test $FullImageName

if ($LASTEXITCODE -eq 0) {
    Write-Host "Attente du demarrage (10 secondes)..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Test du healthcheck
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/healthcheck" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200 -and $response.Content -eq "ok") {
            Write-Host "Test reussi! L'image fonctionne correctement" -ForegroundColor Green
        } else {
            Write-Host "Test incomplet (status: $($response.StatusCode))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Impossible de tester le healthcheck" -ForegroundColor Yellow
    }
    
    # Nettoyer
    Write-Host "Nettoyage du conteneur de test..." -ForegroundColor Gray
    docker stop $testContainer
    docker rm $testContainer
} else {
    Write-Host "Echec du test local, mais on continue..." -ForegroundColor Yellow
}

# Publier sur Docker Hub
Write-Host ""
Write-Host "6. Publication sur Docker Hub..." -ForegroundColor Yellow
Write-Host "Cela peut prendre quelques minutes..." -ForegroundColor Gray
docker push $FullImageName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Publication reussie!" -ForegroundColor Green
    Write-Host ""
    Write-Host "L'image est maintenant disponible sur:" -ForegroundColor Cyan
    Write-Host "  https://hub.docker.com/r/$DockerUsername/$ImageName" -ForegroundColor White
    Write-Host ""
    Write-Host "Pour l'utiliser:" -ForegroundColor Cyan
    Write-Host "  docker pull $FullImageName" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou dans Portainer:" -ForegroundColor Cyan
    Write-Host "  Image: $FullImageName" -ForegroundColor White
    Write-Host ""
    Write-Host "Voir PORTAINER_DEPLOYMENT.md pour le guide complet" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Echec de la publication" -ForegroundColor Red
    exit 1
}
