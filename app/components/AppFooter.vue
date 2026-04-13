<template>
  <footer id="pied" role="contentinfo" class="fr-footer">
    <div class="fr-container">
      <div class="fr-footer__body rr-footer-body">
        <div class="rr-footer-left">
          <div class="rr-footer-ministry">
            <div class="rr-footer-ministry-title">
              MINISTÈRE<br />DES SOLIDARITÉS<br />ET DE LA SANTÉ
            </div>
            <div class="rr-footer-motto">Liberté<br />Égalité<br />Fraternité</div>
          </div>
        </div>

        <div class="rr-footer-mid">
          <p class="rr-footer-text">
            Ce site est géré par le Ministère des solidarités et de la santé
          </p>

          <ul class="rr-footer-sites rr-footer-sites--center" aria-label="Liens officiels">
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://info.gouv.fr"
                target="_blank"
                rel="noopener"
              >
                info.gouv.fr
              </a>
            </li>
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://www.service-public.fr"
                target="_blank"
                rel="noopener"
              >
                service-public.fr
              </a>
            </li>
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://www.legifrance.gouv.fr"
                target="_blank"
                rel="noopener"
              >
                legifrance.gouv.fr
              </a>
            </li>
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://www.data.gouv.fr"
                target="_blank"
                rel="noopener"
              >
                data.gouv.fr
              </a>
            </li>
          </ul>
        </div>
      </div>

      <hr class="fr-hr fr-mt-3w fr-mb-2w" />

      <div class="rr-footer-bottom-links">
        <ul class="rr-footer-bottom-list" aria-label="Liens de bas de page">
          <li>
            <NuxtLink class="fr-link fr-link--sm" to="/accessibilite">Accessibilité</NuxtLink>
          </li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Mentions légales</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Données personnelles</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Gestion des cookies</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Plan du site</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li>
            <a class="fr-link fr-link--sm fr-icon-settings-5-line fr-link--icon-left" href="#" @click.prevent>
              Paramètres d’affichage
            </a>
          </li>
        </ul>
      </div>

      <p class="fr-text--xs fr-mt-2w rr-footer-licence">
        Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous licence
        <a
          class="fr-link fr-link--xs fr-icon-external-link-line fr-link--icon-right"
          href="https://www.etalab.gouv.fr/licence-ouverte-open-licence"
          target="_blank"
          rel="noopener"
        >
          etalab-2.0
        </a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.rr-footer-body {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  align-items: start;
}

.rr-footer-ministry-title {
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.1;
  font-size: 0.95rem;
}

.rr-footer-motto {
  margin-top: 0.5rem;
  font-style: italic;
  font-size: 0.8rem;
  line-height: 1.2;
}

.rr-footer-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.rr-footer-text {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
}

.rr-footer-sites {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.rr-footer-sites--center {
  justify-content: center;
}

.rr-footer-bottom-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.rr-sep {
  opacity: 0.6;
}

.rr-footer-licence {
  margin-bottom: 0;
}

@media (max-width: 980px) {
  .rr-footer-body {
    grid-template-columns: 1fr;
  }

  .rr-footer-mid {
    align-items: flex-start;
  }

  .rr-footer-text {
    text-align: left;
  }

  .rr-footer-sites--center {
    justify-content: flex-start;
  }
}
</style>