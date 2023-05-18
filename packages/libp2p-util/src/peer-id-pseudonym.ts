import { uniqueNamesGenerator, adjectives, colors, names } from 'unique-names-generator';

/**
 * Get a deterministic pseudonym of form [adjective-color-name] for a given libp2p peer id
 * Eg. 12D3KooWJLXEX2GfHPSZR3z9QKNSN8EY6pXo7FZ9XtFhiKLJATtC -> jolly-green-diann
 * @param peerId
 */
export const getPseudonymForPeerId = (peerId: string) => {
  return uniqueNamesGenerator({
    seed: peerId,
    dictionaries: [adjectives, colors, names],
    length: 3,
    style: 'lowerCase',
    separator: '-'
  });
};
